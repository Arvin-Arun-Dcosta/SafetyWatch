import type { NextRequest } from "next/server";

import { MAX_REPORT_IMAGES } from "@/lib/report-meta";
import { getSessionUser } from "@/lib/session";
import { reportIdSchema } from "@/lib/validation";
import { getReportImageUrl } from "@/server/reports/queries";
import { readReportImage } from "@/server/storage";

const notFound = () => new Response("Not found", { status: 404 });

/**
 * Serves one evidence photo from the private blob store. The same visibility
 * rule as the report page applies: public once verified, otherwise only the
 * owner and admins.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext<"/reports/[id]/images/[index]">,
) {
  const params = await context.params;
  const id = reportIdSchema.safeParse(params.id);
  const index = /^\d$/.test(params.index) ? Number(params.index) : -1;
  if (!id.success || index < 0 || index >= MAX_REPORT_IMAGES) return notFound();

  const viewer = await getSessionUser();
  const url = await getReportImageUrl(id.data, index, viewer);
  if (!url) return notFound();

  const result = await readReportImage(url, request.headers.get("if-none-match") ?? undefined);
  if (!result) return notFound();

  // "private, no-cache": the browser may keep a copy but must come back here
  // (and through the access check) before using it.
  if (result.statusCode === 304) {
    return new Response(null, {
      status: 304,
      headers: { ETag: result.blob.etag, "Cache-Control": "private, no-cache" },
    });
  }
  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
      ETag: result.blob.etag,
      "Cache-Control": "private, no-cache",
    },
  });
}
