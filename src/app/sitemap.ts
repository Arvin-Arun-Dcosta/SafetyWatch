import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

const PUBLIC_PATHS = ["", "/crimes", "/reports/map", "/stats", "/reports/anonymous", "/track", "/login", "/register"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}` }));
}
