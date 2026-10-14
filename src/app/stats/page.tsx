import type { Metadata } from "next";
import * as motion from "motion/react-client";

import { StatsCharts } from "@/components/stats/stats-charts";
import { CRIME_TYPE_LABELS } from "@/lib/report-meta";
import { formatDateTime } from "@/server/datetime";
import { getPublicStats } from "@/server/reports/queries";

export const metadata: Metadata = { title: "Statistics" };

export default async function CrimeStatsPage() {
  const stats = await getPublicStats();

  if (stats.total === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <p className="text-xl text-muted-foreground">
          No crime reports available to generate statistics.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Crime Statistics</h1>
          <p className="text-lg text-gray-600">Visualizing crime trends and patterns</p>
        </motion.header>

        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Based on {stats.total} verified reports</span>
          {stats.latestIncidentAt && (
            <span>Latest report: {formatDateTime(stats.latestIncidentAt)}</span>
          )}
        </div>

        <StatsCharts
          byType={stats.byType.map((row) => ({
            name: CRIME_TYPE_LABELS[row.crimeType],
            count: row.count,
          }))}
          byCity={stats.byCity.map((row) => ({ name: row.city, count: row.count }))}
          byMonth={stats.byMonth.map((row) => ({ name: row.month, count: row.count }))}
          byHour={stats.byHour.map((row) => ({
            name: `${String(row.hour).padStart(2, "0")}:00`,
            count: row.count,
          }))}
        />
      </div>
    </div>
  );
}
