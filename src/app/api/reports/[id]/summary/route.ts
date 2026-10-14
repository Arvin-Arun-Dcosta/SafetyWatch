import { CRIME_TYPE_LABELS } from "@/lib/report-meta";
import { reportIdSchema } from "@/lib/validation";
import { formatDateTime } from "@/server/datetime";
import { getPublicReportSummary } from "@/server/reports/queries";

/**
 * Popup content for a map marker. The map itself only receives
 * id/lat/lng/type per report; the rest is fetched when a marker is opened.
 * Public reports only.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/reports/[id]/summary">,
) {
  const { id } = await context.params;
  const parsed = reportIdSchema.safeParse(id);
  const report = parsed.success ? await getPublicReportSummary(parsed.data) : null;
  if (!report) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(
    {
      id: report.id,
      title: report.title,
      description: report.description,
      crimeType: CRIME_TYPE_LABELS[report.crimeType],
      incidentAt: formatDateTime(report.incidentAt),
    },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}
