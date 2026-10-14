import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Page numbers to show: first, last and a window around the current page. */
function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  for (const [i, p] of sorted.entries()) {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("gap");
    result.push(p);
  }
  return result;
}

/**
 * Link-based pagination for server-rendered lists. `hrefFor` builds the URL
 * of a page so the caller can keep its other query parameters.
 */
export function Pagination({
  page,
  pageCount,
  hrefFor,
  label = "Pagination",
  className,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  label?: string;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label={label} className={cn("flex items-center justify-center gap-1", className)}>
      {page > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefFor(page - 1)} rel="prev">
            <ChevronLeft />
            Previous
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft />
          Previous
        </Button>
      )}

      {pageWindow(page, pageCount).map((entry, i) =>
        entry === "gap" ? (
          <span key={`gap-${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={entry}
            asChild
            size="sm"
            variant={entry === page ? "default" : "outline"}
            className="min-w-9"
          >
            <Link href={hrefFor(entry)} aria-current={entry === page ? "page" : undefined}>
              {entry}
            </Link>
          </Button>
        ),
      )}

      {page < pageCount ? (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefFor(page + 1)} rel="next">
            Next
            <ChevronRight />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next
          <ChevronRight />
        </Button>
      )}
    </nav>
  );
}
