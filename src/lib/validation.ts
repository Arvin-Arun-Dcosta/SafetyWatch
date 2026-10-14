import { z } from "zod";

import { CRIME_TYPES, REPORT_STATUSES } from "@/lib/report-meta";

/**
 * Zod schemas shared by the forms (client-side feedback) and the server
 * actions (the validation that actually counts).
 */

const TRACKING_ID_PATTERN = /^[0-9a-f]{16}$/;

export const trackingIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(TRACKING_ID_PATTERN, { error: "Tracking IDs are 16 characters (0-9, a-f)." });

export const reportIdSchema = z.uuid({ error: "Invalid report id." });

/** The fields a reporter types in. Also the react-hook-form schema. */
export const reportFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, { error: "Title must be at least 5 characters." })
    .max(120, { error: "Title must be at most 120 characters." }),
  description: z
    .string()
    .trim()
    .min(10, { error: "Description must be at least 10 characters." })
    .max(5000, { error: "Description must be at most 5000 characters." }),
  // Kept as a string here because the form field starts empty; the server
  // schema below narrows it to the enum.
  crimeType: z
    .string()
    .refine((value) => (CRIME_TYPES as readonly string[]).includes(value), {
      error: "Please select a crime type.",
    }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Please select a date." }),
  time: z.string().regex(/^\d{2}:\d{2}$/, { error: "Please select a time." }),
  address: z
    .string()
    .trim()
    .min(5, { error: "Please enter a valid address." })
    .max(300, { error: "Address must be at most 300 characters." }),
});

export type ReportFormValues = z.infer<typeof reportFieldsSchema>;

/** Everything the server needs to create or update a report. */
export const reportInputSchema = reportFieldsSchema.extend({
  crimeType: z.enum(CRIME_TYPES, { error: "Please select a crime type." }),
  latitude: z.coerce
    .number({ error: "Please pick the location on the map." })
    .min(-90)
    .max(90),
  longitude: z.coerce
    .number({ error: "Please pick the location on the map." })
    .min(-180)
    .max(180),
  city: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => value || undefined),
});

export const statusUpdateSchema = z.object({
  reportId: reportIdSchema,
  status: z.enum(REPORT_STATUSES),
});

export const signInSchema = z.object({
  email: z.email({ error: "Please enter a valid email address." }),
  password: z.string().min(1, { error: "Please enter your password." }),
});

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: "Name must be at least 2 characters." })
      .max(80, { error: "Name must be at most 80 characters." }),
    email: z.email({ error: "Please enter a valid email address." }),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters." })
      .max(128, { error: "Password must be at most 128 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/** `?page=` query parameter: a positive integer, defaulting to 1. */
export const pageParamSchema = z.coerce.number().int().min(1).max(100_000).catch(1);

/** Result shape returned by every server action. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
