import type { CrimeType, ReportStatus } from "@/generated/prisma/enums";

/**
 * Display metadata and business rules for reports. Safe to import from both
 * Server and Client Components (types only from the generated client).
 */

/** Order used in forms and filters. */
export const CRIME_TYPES = [
  "THEFT",
  "BURGLARY",
  "ASSAULT",
  "FRAUD",
  "VANDALISM",
  "SUSPICIOUS_ACTIVITY",
  "OTHER",
] as const satisfies readonly CrimeType[];

export const CRIME_TYPE_LABELS: Record<CrimeType, string> = {
  THEFT: "Theft",
  BURGLARY: "Burglary",
  ASSAULT: "Assault",
  FRAUD: "Fraud",
  VANDALISM: "Vandalism",
  SUSPICIOUS_ACTIVITY: "Suspicious Activity",
  OTHER: "Other",
};

/** Map marker and legend colours. */
export const CRIME_TYPE_COLORS: Record<CrimeType, string> = {
  THEFT: "#3b82f6",
  ASSAULT: "#ef4444",
  FRAUD: "#f59e0b",
  VANDALISM: "#10b981",
  BURGLARY: "#8b5cf6",
  SUSPICIOUS_ACTIVITY: "#ec4899",
  OTHER: "#ec4899",
};

export const REPORT_STATUSES = [
  "PENDING",
  "REVIEWING",
  "VERIFIED",
  "RESOLVED",
  "REJECTED",
] as const satisfies readonly ReportStatus[];

export const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: "Pending",
  REVIEWING: "Reviewing",
  VERIFIED: "Verified",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

export const STATUS_BADGE_CLASSES: Record<ReportStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  REVIEWING: "bg-blue-100 text-blue-800 border-blue-200",
  VERIFIED: "bg-purple-100 text-purple-800 border-purple-200",
  RESOLVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

/** Only reports an admin has verified are ever shown to the public. */
export const PUBLIC_STATUSES = ["VERIFIED", "RESOLVED"] as const satisfies readonly ReportStatus[];

/** Closed reports, listed under "Archived" on the admin dashboard. */
export const ARCHIVED_STATUSES = ["RESOLVED", "REJECTED"] as const satisfies readonly ReportStatus[];

/** The review workflow. Enforced on the server in updateReportStatus. */
export const STATUS_TRANSITIONS: Record<ReportStatus, readonly ReportStatus[]> = {
  PENDING: ["REVIEWING"],
  REVIEWING: ["VERIFIED", "REJECTED"],
  VERIFIED: ["RESOLVED"],
  RESOLVED: [],
  REJECTED: [],
};

export function isPublicStatus(status: ReportStatus): boolean {
  return (PUBLIC_STATUSES as readonly ReportStatus[]).includes(status);
}

/** Evidence photo limits, shared by the picker and the server action. */
export const MAX_REPORT_IMAGES = 3;
/** Per image, after the browser has downscaled it to JPEG. */
export const MAX_IMAGE_BYTES = 1_000_000;
