"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

// Leaflet needs `window`; `ssr: false` is only allowed in a Client Component.
const ReportLocationMap = dynamic(() => import("@/components/maps/report-location-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-md" />,
});

export function ReportLocationMapLoader(props: { lat: number; lng: number }) {
  return <ReportLocationMap {...props} />;
}
