import type { ReportStatus } from "@/generated/prisma/enums";
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/lib/report-meta";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium border",
        STATUS_BADGE_CLASSES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
