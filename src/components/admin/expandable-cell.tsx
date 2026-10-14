"use client";

import { useState } from "react";

import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** A table cell that is cut off with an ellipsis until it is clicked. */
export function ExpandableCell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TableCell
      className={cn(
        "cursor-pointer",
        expanded ? "whitespace-normal break-words" : "truncate",
        className,
      )}
      onClick={() => setExpanded((value) => !value)}
    >
      {children}
    </TableCell>
  );
}
