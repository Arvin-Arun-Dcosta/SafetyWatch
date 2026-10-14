import { z } from "zod";

import { pageParamSchema } from "@/lib/validation";

/**
 * The admin dashboard keeps its state (search, filter, sort, pages) in the
 * URL so the server can do the filtering, sorting and pagination.
 */
export const adminSearchSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  reporter: z.enum(["all", "authenticated", "anonymous"]).catch("all"),
  sort: z.enum(["date", "type", "status"]).catch("date"),
  dir: z.enum(["asc", "desc"]).catch("desc"),
  /** Page of the active table. */
  page: pageParamSchema,
  /** Page of the archived table. */
  apage: pageParamSchema,
});

export type AdminSearch = z.infer<typeof adminSearchSchema>;

const DEFAULTS: AdminSearch = {
  q: "",
  reporter: "all",
  sort: "date",
  dir: "desc",
  page: 1,
  apage: 1,
};

/** URL for the dashboard with some parameters changed; defaults are left out. */
export function adminHref(current: AdminSearch, patch: Partial<AdminSearch> = {}): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const key of Object.keys(DEFAULTS) as (keyof AdminSearch)[]) {
    if (next[key] !== DEFAULTS[key]) params.set(key, String(next[key]));
  }
  const query = params.toString();
  return query ? `/admin/dashboard?${query}` : "/admin/dashboard";
}
