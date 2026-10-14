"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReportStatus } from "@/generated/prisma/enums";
import { STATUS_LABELS, STATUS_TRANSITIONS } from "@/lib/report-meta";
import { updateReportStatus } from "@/server/reports/actions";

/**
 * Status dropdown for one report. It only offers the next steps of the review
 * workflow; the server enforces the same rule and refreshes the table.
 */
export function StatusSelect({ reportId, status }: { reportId: string; status: ReportStatus }) {
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    startTransition(async () => {
      const result = await updateReportStatus({ reportId, status: next });
      if (result.ok) {
        toast.success(`Status updated to ${STATUS_LABELS[next as ReportStatus].toLowerCase()}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger
        aria-label="Change status"
        className="w-[140px] border-none bg-transparent group-hover:bg-gray-100 transition-colors"
      >
        <SelectValue>
          <StatusBadge status={status} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_TRANSITIONS[status].map((next) => (
          <SelectItem key={next} value={next}>
            <StatusBadge status={next} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
