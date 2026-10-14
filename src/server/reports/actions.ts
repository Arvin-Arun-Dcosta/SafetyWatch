"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  MAX_IMAGE_BYTES,
  MAX_REPORT_IMAGES,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
} from "@/lib/report-meta";
import { getSessionUser } from "@/lib/session";
import {
  type ActionResult,
  reportIdSchema,
  reportInputSchema,
  statusUpdateSchema,
} from "@/lib/validation";
import { parseZonedDateTime } from "@/server/datetime";
import { isJpeg } from "@/server/images";
import { deleteReportImages, storeReportImage } from "@/server/storage";

/**
 * Report mutations. Server actions are public HTTP endpoints, so each one
 * re-checks the session and role and validates its input with zod before it
 * touches the database. Nothing from the request is passed to Prisma as-is.
 */

/** Allow for a few minutes of clock difference between browser and server. */
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

function invalid(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Parses and validates the report fields of a submitted form. */
function parseReportForm(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : undefined;
  };
  const parsed = reportInputSchema.safeParse({
    title: text("title"),
    description: text("description"),
    crimeType: text("crimeType"),
    date: text("date"),
    time: text("time"),
    address: text("address"),
    // An empty string would coerce to 0, a valid coordinate, so drop it.
    latitude: text("latitude") || undefined,
    longitude: text("longitude") || undefined,
    city: text("city"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      (fieldErrors[field] ??= []).push(issue.message);
    }
    return invalid("Please check the highlighted fields.", fieldErrors);
  }

  const incidentAt = parseZonedDateTime(parsed.data.date, parsed.data.time);
  if (!incidentAt) {
    return invalid("Please check the highlighted fields.", { date: ["That date does not exist."] });
  }
  if (incidentAt.getTime() > Date.now() + FUTURE_TOLERANCE_MS) {
    return invalid("Please check the highlighted fields.", {
      date: ["The incident cannot be in the future."],
    });
  }

  const { title, description, crimeType, address, latitude, longitude, city } = parsed.data;
  return {
    ok: true as const,
    data: {
      title,
      description,
      crimeType,
      location: address,
      city: city ?? cityFromAddress(address),
      latitude,
      longitude,
      incidentAt,
    },
  };
}

/**
 * Best-effort locality for an address typed by hand: the last part that is
 * neither a postcode nor the country ("…, Thane, Maharashtra, 400601, India"
 * gives "Maharashtra"). The map picker normally supplies a precise city.
 */
function cityFromAddress(address: string): string | null {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && !/^\d[\d\s-]*$/.test(part));
  if (parts.length < 2) return null;
  return parts[parts.length - 2].slice(0, 80);
}

function newTrackingId(): string {
  return randomBytes(8).toString("hex");
}

/**
 * Submits a report. Open to everyone except admins.
 *
 * A report is anonymous when the visitor is not signed in or ticks the
 * anonymous option; anonymous reports are stored without any link to a user.
 */
export async function createReport(formData: FormData): Promise<ActionResult<{ trackingId: string }>> {
  const viewer = await getSessionUser();
  if (viewer?.role === "ADMIN") {
    return invalid("Admins cannot submit reports.");
  }

  const parsed = parseReportForm(formData);
  if (!parsed.ok) return parsed;

  const images = await readEvidenceImages(formData);
  if (!images.ok) return images;

  const isAnonymous = !viewer || formData.get("anonymous") === "true";

  // Photos go to blob storage first; the row only stores their URLs. If the
  // insert fails, the uploads are removed again so nothing is orphaned.
  const folder = randomBytes(8).toString("hex");
  const imageUrls: string[] = [];
  try {
    for (const [index, bytes] of images.data.entries()) {
      imageUrls.push(await storeReportImage(folder, index, bytes));
    }
    const report = await prisma.report.create({
      data: {
        ...parsed.data,
        trackingId: newTrackingId(),
        isAnonymous,
        userId: isAnonymous ? null : viewer.id,
        imageUrls,
      },
      select: { trackingId: true },
    });

    if (!isAnonymous) revalidatePath("/dashboard");
    revalidatePath("/admin/dashboard");
    return { ok: true, data: { trackingId: report.trackingId } };
  } catch (error) {
    console.error("Creating a report failed:", error instanceof Error ? error.message : error);
    await deleteReportImages(imageUrls).catch(() => undefined);
    return invalid("We could not save your report. Please try again.");
  }
}

/** Validates the uploaded photos: at most three, each a JPEG under the size limit. */
async function readEvidenceImages(formData: FormData) {
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > MAX_REPORT_IMAGES) {
    return invalid(`You can attach at most ${MAX_REPORT_IMAGES} photos.`);
  }
  const data: Buffer[] = [];
  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) {
      return invalid("One of the photos is too large. Please remove it and add it again.");
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!isJpeg(bytes)) {
      return invalid("Photos must be JPEG images.");
    }
    data.push(bytes);
  }
  return { ok: true as const, data };
}

/** Edits a report. Only its owner, and only while it is still pending. */
export async function updateReport(
  reportId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const viewer = await getSessionUser();
  if (!viewer) return invalid("Please sign in to edit your report.");

  const id = reportIdSchema.safeParse(reportId);
  if (!id.success) return invalid("Report not found.");

  const parsed = parseReportForm(formData);
  if (!parsed.ok) return parsed;

  // Ownership and status are part of the WHERE clause, so a report that is
  // not the caller's, or has already been picked up for review, is untouched.
  const updated = await prisma.report.updateMany({
    where: { id: id.data, userId: viewer.id, status: "PENDING" },
    data: parsed.data,
  });
  if (updated.count === 0) {
    return invalid("This report can no longer be edited.");
  }

  revalidatePath("/dashboard");
  revalidatePath(`/reports/${id.data}`);
  revalidatePath("/admin/dashboard");
  return { ok: true, data: { id: id.data } };
}

/** Moves a report along the review workflow. Admins only. */
export async function updateReportStatus(input: {
  reportId: string;
  status: string;
}): Promise<ActionResult> {
  const viewer = await getSessionUser();
  if (viewer?.role !== "ADMIN") return invalid("Only admins can change a report's status.");

  const parsed = statusUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid("Invalid status update.");
  const { reportId, status } = parsed.data;

  const current = await prisma.report.findUnique({
    where: { id: reportId },
    select: { status: true },
  });
  if (!current) return invalid("Report not found.");
  if (!STATUS_TRANSITIONS[current.status].includes(status)) {
    return invalid(
      `A ${STATUS_LABELS[current.status].toLowerCase()} report cannot be marked as ${STATUS_LABELS[status].toLowerCase()}.`,
    );
  }

  // Guard on the status we just read so two admins cannot both apply a
  // transition from the same starting point.
  const updated = await prisma.report.updateMany({
    where: { id: reportId, status: current.status },
    data: { status },
  });
  if (updated.count === 0) return invalid("This report was just updated by someone else.");

  revalidateReportPages(reportId);
  return { ok: true, data: undefined };
}

/** Deletes a report. Admins only. */
export async function deleteReport(reportId: string): Promise<ActionResult> {
  const viewer = await getSessionUser();
  if (viewer?.role !== "ADMIN") return invalid("Only admins can delete reports.");

  const id = reportIdSchema.safeParse(reportId);
  if (!id.success) return invalid("Report not found.");

  const report = await prisma.report.findUnique({
    where: { id: id.data },
    select: { imageUrls: true },
  });
  if (!report) return invalid("Report not found.");

  await prisma.report.delete({ where: { id: id.data } });
  // The row is gone; a failed blob clean-up only leaves unreachable files.
  await deleteReportImages(report.imageUrls).catch((error: unknown) => {
    console.error("Deleting report photos failed:", error instanceof Error ? error.message : error);
  });

  revalidateReportPages(id.data);
  return { ok: true, data: undefined };
}

function revalidateReportPages(reportId: string) {
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/crimes");
  revalidatePath("/stats");
  revalidatePath("/reports/map");
  revalidatePath(`/reports/${reportId}`);
}
