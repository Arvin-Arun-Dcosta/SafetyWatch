"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getCurrentPosition } from "@/lib/geocoding";

/**
 * "Sort by Nearby" needs the visitor's position, which only the browser has.
 * It is put in the URL (rounded to roughly 100 m) so the server can sort and
 * paginate by distance.
 */
export function SortControls({ sort }: { sort: "all" | "nearby" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    getCurrentPosition({ enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 })
      .then(({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }))
      .catch(() => {
        toast.warning("Location not available. Showing all reports by date.");
      });
  }, []);

  function go(href: string) {
    startTransition(() => router.push(href, { scroll: false }));
  }

  return (
    <div className="flex justify-center space-x-4 mt-15 mb-1">
      <Button
        onClick={() => {
          if (position) {
            go(`/crimes?sort=nearby&lat=${position.lat.toFixed(3)}&lng=${position.lng.toFixed(3)}`);
          }
        }}
        variant={sort === "nearby" ? "default" : "outline"}
        disabled={!position || isPending}
        className="transition-all duration-200 hover:shadow-md"
      >
        {isPending && sort !== "nearby" ? "Sorting..." : "Sort by Nearby"}
      </Button>
      <Button
        onClick={() => go("/crimes")}
        variant={sort === "all" ? "default" : "outline"}
        disabled={isPending}
        className="transition-all duration-200 hover:shadow-md"
      >
        {isPending && sort !== "all" ? "Sorting..." : "Show All (Newest First)"}
      </Button>
    </div>
  );
}
