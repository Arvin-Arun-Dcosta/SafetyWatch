"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import type { MapPoint } from "@/server/reports/queries";

// Leaflet needs `window`; `ssr: false` is only allowed in a Client Component.
const CrimeMap = dynamic(() => import("@/components/maps/crime-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-muted rounded-lg">
      <div className="flex flex-col items-center gap-4">
        <p className="text-muted-foreground">Loading map...</p>
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ),
});

export function CrimeMapLoader({ points }: { points: MapPoint[] }) {
  return <CrimeMap points={points} />;
}
