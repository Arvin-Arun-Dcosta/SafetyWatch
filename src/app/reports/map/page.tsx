import type { Metadata } from "next";

import { CrimeMapLoader } from "@/components/maps/crime-map-loader";
import { Card, CardContent } from "@/components/ui/card";
import { getMapPoints } from "@/server/reports/queries";

export const metadata: Metadata = { title: "Crime Map" };

export default async function CrimeMapPage() {
  // One small {id, lat, lng, type} record per public report.
  const points = await getMapPoints();

  return (
    <div className="flex min-h-screen flex-col max-w-[95%] mx-auto">
      <div className="flex-1 py-8 md:py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Crime Report Map</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              View the geographic distribution of reported incidents
            </p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0 overflow-hidden">
            {points.length === 0 ? (
              <div className="h-[600px] flex flex-col items-center justify-center gap-4 bg-muted rounded-lg">
                <p className="text-muted-foreground">No verified reports to show on the map yet.</p>
              </div>
            ) : (
              <div className="h-[600px] md:h-[700px]">
                <CrimeMapLoader points={points} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
