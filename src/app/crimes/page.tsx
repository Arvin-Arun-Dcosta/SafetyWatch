import type { Metadata } from "next";
import Link from "next/link";
import * as motion from "motion/react-client";
import { z } from "zod";

import { SortControls } from "@/components/crimes/sort-controls";
import { Pagination } from "@/components/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CRIME_TYPE_LABELS } from "@/lib/report-meta";
import { pageParamSchema } from "@/lib/validation";
import { formatDateTime } from "@/server/datetime";
import { listPublicReports, listPublicReportsNear } from "@/server/reports/queries";

export const metadata: Metadata = { title: "Crime Reports" };

const searchSchema = z.object({
  page: pageParamSchema,
  sort: z.enum(["all", "nearby"]).catch("all"),
  lat: z.coerce.number().min(-90).max(90).optional().catch(undefined),
  lng: z.coerce.number().min(-180).max(180).optional().catch(undefined),
});

export default async function CrimesPage({ searchParams }: PageProps<"/crimes">) {
  const search = searchSchema.parse(await searchParams);
  const origin =
    search.sort === "nearby" && search.lat !== undefined && search.lng !== undefined
      ? { latitude: search.lat, longitude: search.lng }
      : null;

  const reports = origin
    ? await listPublicReportsNear(origin, search.page)
    : await listPublicReports(search.page);

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    if (origin) {
      params.set("sort", "nearby");
      params.set("lat", String(origin.latitude));
      params.set("lng", String(origin.longitude));
    }
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `/crimes?${query}` : "/crimes";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto p-8 flex-grow">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight">Reported Crimes</h1>
          <p className="text-muted-foreground mt-2">
            Browse and view details of reported incidents.
          </p>
        </motion.header>

        <SortControls sort={origin ? "nearby" : "all"} />
        <div className="my-10 border-t-2 border-[#3b5998]" />

        {reports.items.length === 0 ? (
          <p className="text-center text-muted-foreground my-16">
            No verified reports to show yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 my-10">
            {reports.items.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/reports/${report.id}`} className="block h-full">
                  <Card className="h-full flex flex-col transition-all duration-200 border border-[#3b5998] shadow-lg rounded-xl bg-[#f5f8fa] hover:bg-[#e4eaf3] cursor-pointer p-6">
                    <CardHeader className="p-0 mb-2">
                      <CardTitle className="text-lg text-[#000040]">{report.title}</CardTitle>
                      <p className="text-sm text-blue-900">
                        {CRIME_TYPE_LABELS[report.crimeType]}
                        {"  • "}
                        {formatDateTime(report.incidentAt)}
                      </p>
                    </CardHeader>
                    <CardContent className="flex-grow p-0">
                      <p className="text-sm mb-5 line-clamp-3 text-justify text-blue-900">
                        {report.description}
                      </p>
                      <p className="text-xs text-blue-700 mb-1 truncate">
                        Location: {report.location}
                      </p>
                      {report.distanceKm !== undefined && (
                        <p className="text-xs text-blue-700">
                          Distance: {report.distanceKm.toFixed(2)} km away
                        </p>
                      )}
                    </CardContent>
                    <div className="pt-2 pb-1 text-center">
                      <span className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                        View Details
                      </span>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <Pagination
          page={reports.page}
          pageCount={reports.pageCount}
          hrefFor={hrefFor}
          label="Crime report pages"
        />
        <div className="my-10 border-t-2 border-[#3b5998]" />
      </div>
    </div>
  );
}
