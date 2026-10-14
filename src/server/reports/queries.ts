import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { CrimeType, ReportStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  ARCHIVED_STATUSES,
  CRIME_TYPE_LABELS,
  CRIME_TYPES,
  PUBLIC_STATUSES,
  REPORT_STATUSES,
  STATUS_LABELS,
  isPublicStatus,
} from "@/lib/report-meta";
import type { SessionUser } from "@/lib/session";
import { APP_TIME_ZONE } from "@/server/datetime";

/**
 * Every read of the report table goes through this module.
 *
 * Rules that hold for all of it:
 *  - Public queries filter on PUBLIC_STATUSES in the WHERE clause, so pending,
 *    reviewing and rejected reports (anonymous or not) never leave the
 *    database for an anonymous visitor.
 *  - Queries use an explicit `select`. Reporter name and email are only
 *    selected by the admin queries.
 */

const PUBLIC_PAGE_SIZE = 12;
const USER_PAGE_SIZE = 12;
const ADMIN_PAGE_SIZE = 20;
const EXCERPT_LENGTH = 320;

const publicWhere = {
  status: { in: [...PUBLIC_STATUSES] },
} satisfies Prisma.ReportWhereInput;

/** Same filter for raw SQL. */
const publicStatusSql = Prisma.join(
  PUBLIC_STATUSES.map((status) => Prisma.sql`${status}::"ReportStatus"`),
);

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
};

function pageBounds(total: number, requestedPage: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  return { page, pageCount, skip: (page - 1) * pageSize, take: pageSize };
}

function excerpt(text: string): string {
  return text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH).trimEnd()}…` : text;
}

// ---------------------------------------------------------------------------
// Public: list, map, statistics
// ---------------------------------------------------------------------------

export type PublicReportListItem = {
  id: string;
  title: string;
  description: string;
  crimeType: CrimeType;
  location: string;
  incidentAt: Date;
  /** Only set when sorting by distance. */
  distanceKm?: number;
};

/** Verified and resolved reports, newest incident first. */
export async function listPublicReports(requestedPage: number): Promise<Page<PublicReportListItem>> {
  const total = await prisma.report.count({ where: publicWhere });
  const { page, pageCount, skip, take } = pageBounds(total, requestedPage, PUBLIC_PAGE_SIZE);
  const rows = await prisma.report.findMany({
    where: publicWhere,
    orderBy: [{ incidentAt: "desc" }, { id: "asc" }],
    skip,
    take,
    select: {
      id: true,
      title: true,
      description: true,
      crimeType: true,
      location: true,
      incidentAt: true,
    },
  });
  return {
    items: rows.map((row) => ({ ...row, description: excerpt(row.description) })),
    total,
    page,
    pageCount,
  };
}

/** Verified and resolved reports, nearest first (great-circle distance). */
export async function listPublicReportsNear(
  origin: { latitude: number; longitude: number },
  requestedPage: number,
): Promise<Page<PublicReportListItem>> {
  const total = await prisma.report.count({ where: publicWhere });
  const { page, pageCount, skip, take } = pageBounds(total, requestedPage, PUBLIC_PAGE_SIZE);
  const { latitude, longitude } = origin;
  const rows = await prisma.$queryRaw<
    {
      id: string;
      title: string;
      description: string;
      crimeType: CrimeType;
      location: string;
      incidentAt: Date;
      distanceKm: number;
    }[]
  >`
    SELECT
      id,
      title,
      description,
      "crimeType"::text AS "crimeType",
      location,
      "incidentAt",
      (6371 * 2 * asin(least(1, sqrt(
        power(sin(radians(latitude - ${latitude}::float8) / 2), 2) +
        cos(radians(${latitude}::float8)) * cos(radians(latitude)) *
        power(sin(radians(longitude - ${longitude}::float8) / 2), 2)
      ))))::float8 AS "distanceKm"
    FROM report
    WHERE status IN (${publicStatusSql})
    ORDER BY "distanceKm" ASC, "incidentAt" DESC, id ASC
    LIMIT ${take} OFFSET ${skip}
  `;
  return {
    items: rows.map((row) => ({ ...row, description: excerpt(row.description) })),
    total,
    page,
    pageCount,
  };
}

/** One point per public report. Kept tiny because the map loads all of them. */
export type MapPoint = { id: string; lat: number; lng: number; type: CrimeType };

export async function getMapPoints(): Promise<MapPoint[]> {
  const rows = await prisma.report.findMany({
    where: publicWhere,
    select: { id: true, latitude: true, longitude: true, crimeType: true },
  });
  return rows.map((row) => ({
    id: row.id,
    lat: row.latitude,
    lng: row.longitude,
    type: row.crimeType,
  }));
}

/** Popup content for one map marker, loaded when the marker is clicked. */
export async function getPublicReportSummary(id: string) {
  const row = await prisma.report.findFirst({
    where: { id, ...publicWhere },
    select: { id: true, title: true, description: true, crimeType: true, incidentAt: true },
  });
  return row ? { ...row, description: excerpt(row.description) } : null;
}

export type PublicStats = {
  total: number;
  latestIncidentAt: Date | null;
  byType: { crimeType: CrimeType; count: number }[];
  byCity: { city: string; count: number }[];
  byMonth: { month: string; count: number }[];
  byHour: { hour: number; count: number }[];
};

/** Statistics over public reports, aggregated in the database. */
export async function getPublicStats(): Promise<PublicStats> {
  const [summary, byType, byCity, byMonth, byHour] = await Promise.all([
    prisma.report.aggregate({
      where: publicWhere,
      _count: { _all: true },
      _max: { incidentAt: true },
    }),
    prisma.report.groupBy({
      by: ["crimeType"],
      where: publicWhere,
      _count: { _all: true },
      orderBy: { _count: { crimeType: "desc" } },
    }),
    prisma.report.groupBy({
      by: ["city"],
      where: { ...publicWhere, city: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { city: "desc" } },
      take: 10,
    }),
    prisma.$queryRaw<{ month: string; count: number }[]>`
      SELECT
        to_char(date_trunc('month', "incidentAt" AT TIME ZONE ${APP_TIME_ZONE}), 'YYYY/MM') AS month,
        count(*)::int AS count
      FROM report
      WHERE status IN (${publicStatusSql})
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<{ hour: number; count: number }[]>`
      SELECT
        extract(hour FROM "incidentAt" AT TIME ZONE ${APP_TIME_ZONE})::int AS hour,
        count(*)::int AS count
      FROM report
      WHERE status IN (${publicStatusSql})
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  return {
    total: summary._count._all,
    latestIncidentAt: summary._max.incidentAt,
    byType: byType.map((row) => ({ crimeType: row.crimeType, count: row._count._all })),
    byCity: byCity.flatMap((row) => (row.city ? [{ city: row.city, count: row._count._all }] : [])),
    byMonth,
    byHour,
  };
}

// ---------------------------------------------------------------------------
// One report
// ---------------------------------------------------------------------------

export type ReportDetail = {
  id: string;
  title: string;
  description: string;
  crimeType: CrimeType;
  status: ReportStatus;
  location: string;
  latitude: number;
  longitude: number;
  incidentAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isAnonymous: boolean;
  imageCount: number;
  actionDetails: string | null;
  /** Null unless the viewer is the owner or an admin. */
  trackingId: string | null;
  /** Null unless the viewer is the owner or an admin, and the report is not anonymous. */
  reporter: { name: string; email: string } | null;
  viewerIsOwner: boolean;
  viewerCanEdit: boolean;
};

/**
 * A report as the given viewer may see it, or null.
 *
 * Anonymous visitors and other users only match public reports; owners also
 * match their own; admins match everything. The reporter's name and email are
 * only joined for admins (an owner already knows their own).
 */
export async function getReportForViewer(
  id: string,
  viewer: SessionUser | null,
): Promise<ReportDetail | null> {
  const isAdmin = viewer?.role === "ADMIN";
  const visibility: Prisma.ReportWhereInput = isAdmin
    ? {}
    : { OR: [publicWhere, ...(viewer ? [{ userId: viewer.id }] : [])] };

  const row = await prisma.report.findFirst({
    where: { id, ...visibility },
    select: {
      id: true,
      title: true,
      description: true,
      crimeType: true,
      status: true,
      location: true,
      latitude: true,
      longitude: true,
      incidentAt: true,
      createdAt: true,
      updatedAt: true,
      isAnonymous: true,
      imageUrls: true,
      actionDetails: true,
      trackingId: true,
      userId: true,
      user: isAdmin ? { select: { name: true, email: true } } : false,
    },
  });
  if (!row) return null;

  const viewerIsOwner = viewer !== null && row.userId === viewer.id;
  const privileged = isAdmin || viewerIsOwner;
  const reporter = row.isAnonymous
    ? null
    : isAdmin
      ? (row.user ?? null)
      : viewerIsOwner && viewer
        ? { name: viewer.name, email: viewer.email }
        : null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    crimeType: row.crimeType,
    status: row.status,
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    incidentAt: row.incidentAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isAnonymous: row.isAnonymous,
    imageCount: row.imageUrls.length,
    actionDetails: row.actionDetails,
    trackingId: privileged ? row.trackingId : null,
    reporter,
    viewerIsOwner,
    viewerCanEdit: viewerIsOwner && row.status === "PENDING",
  };
}

/** What the image route needs to authorise and serve one evidence photo. */
export async function getReportImageUrl(
  id: string,
  index: number,
  viewer: SessionUser | null,
): Promise<string | null> {
  const row = await prisma.report.findUnique({
    where: { id },
    select: { status: true, userId: true, imageUrls: true },
  });
  if (!row) return null;
  const allowed =
    isPublicStatus(row.status) ||
    viewer?.role === "ADMIN" ||
    (viewer !== null && row.userId === viewer.id);
  return allowed ? (row.imageUrls[index] ?? null) : null;
}

export type TrackedReport = {
  title: string;
  description: string;
  status: ReportStatus;
  location: string;
  incidentAt: Date;
  /** Set when this viewer may open the full report page. */
  detailsId: string | null;
};

/**
 * Status lookup by tracking ID. The tracking ID is the reporter's proof that
 * the report is theirs, so this works for unverified reports too, but it
 * returns no reporter details, coordinates or images.
 */
export async function getReportByTrackingId(
  trackingId: string,
  viewer: SessionUser | null,
): Promise<TrackedReport | null> {
  const row = await prisma.report.findUnique({
    where: { trackingId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      location: true,
      incidentAt: true,
      userId: true,
    },
  });
  if (!row) return null;
  const canOpenDetails =
    isPublicStatus(row.status) ||
    viewer?.role === "ADMIN" ||
    (viewer !== null && row.userId === viewer.id);
  return {
    title: row.title,
    description: row.description,
    status: row.status,
    location: row.location,
    incidentAt: row.incidentAt,
    detailsId: canOpenDetails ? row.id : null,
  };
}

// ---------------------------------------------------------------------------
// Signed-in user
// ---------------------------------------------------------------------------

export type UserReportListItem = {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  location: string;
  incidentAt: Date;
};

export async function listUserReports(
  userId: string,
  requestedPage: number,
): Promise<Page<UserReportListItem>> {
  const where = { userId } satisfies Prisma.ReportWhereInput;
  const total = await prisma.report.count({ where });
  const { page, pageCount, skip, take } = pageBounds(total, requestedPage, USER_PAGE_SIZE);
  const rows = await prisma.report.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip,
    take,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      location: true,
      incidentAt: true,
    },
  });
  return {
    items: rows.map((row) => ({ ...row, description: excerpt(row.description) })),
    total,
    page,
    pageCount,
  };
}

/** A user's own report, only while it can still be edited (PENDING). */
export async function getEditableReport(id: string, userId: string) {
  return prisma.report.findFirst({
    where: { id, userId, status: "PENDING" },
    select: {
      id: true,
      title: true,
      description: true,
      crimeType: true,
      location: true,
      latitude: true,
      longitude: true,
      incidentAt: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export type AdminReportFilters = {
  /** Free text: title, crime type, status or tracking ID. */
  q: string;
  reporter: "all" | "authenticated" | "anonymous";
  sort: "date" | "type" | "status";
  dir: "asc" | "desc";
};

export type AdminReportListItem = {
  id: string;
  title: string;
  crimeType: CrimeType;
  status: ReportStatus;
  location: string;
  trackingId: string;
  incidentAt: Date;
  isAnonymous: boolean;
  reporterEmail: string | null;
};

function adminWhere(filters: AdminReportFilters, archived: boolean): Prisma.ReportWhereInput {
  const and: Prisma.ReportWhereInput[] = [
    { status: archived ? { in: [...ARCHIVED_STATUSES] } : { notIn: [...ARCHIVED_STATUSES] } },
  ];
  if (filters.reporter !== "all") {
    and.push({ isAnonymous: filters.reporter === "anonymous" });
  }
  const q = filters.q.trim().toLowerCase();
  if (q) {
    const types = CRIME_TYPES.filter((type) => CRIME_TYPE_LABELS[type].toLowerCase().includes(q));
    const statuses = REPORT_STATUSES.filter((status) =>
      STATUS_LABELS[status].toLowerCase().includes(q),
    );
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { trackingId: { startsWith: q } },
        ...(types.length ? [{ crimeType: { in: types } }] : []),
        ...(statuses.length ? [{ status: { in: statuses } }] : []),
      ],
    });
  }
  return { AND: and };
}

function adminOrderBy(filters: AdminReportFilters): Prisma.ReportOrderByWithRelationInput[] {
  switch (filters.sort) {
    case "type":
      return [{ crimeType: filters.dir }, { incidentAt: "desc" }, { id: "asc" }];
    case "status":
      return [{ status: filters.dir }, { incidentAt: "desc" }, { id: "asc" }];
    case "date":
      return [{ incidentAt: filters.dir }, { id: "asc" }];
  }
}

/** Active (open) or archived (resolved/rejected) reports for the admin table. */
export async function listAdminReports(
  filters: AdminReportFilters,
  options: { archived: boolean; page: number },
): Promise<Page<AdminReportListItem>> {
  const where = adminWhere(filters, options.archived);
  const total = await prisma.report.count({ where });
  const { page, pageCount, skip, take } = pageBounds(total, options.page, ADMIN_PAGE_SIZE);
  const rows = await prisma.report.findMany({
    where,
    orderBy: adminOrderBy(filters),
    skip,
    take,
    select: {
      id: true,
      title: true,
      crimeType: true,
      status: true,
      location: true,
      trackingId: true,
      incidentAt: true,
      isAnonymous: true,
      user: { select: { email: true } },
    },
  });
  return {
    items: rows.map(({ user, ...row }) => ({
      ...row,
      reporterEmail: row.isAnonymous ? null : (user?.email ?? null),
    })),
    total,
    page,
    pageCount,
  };
}
