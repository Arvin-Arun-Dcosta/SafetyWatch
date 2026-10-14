"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteReport } from "@/server/reports/actions";

export function DeleteReportButton({ reportId, title }: { reportId: string; title: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteReport(reportId);
      if (result.ok) toast.success("Report deleted.");
      else toast.error(result.error);
    });
  }

  return (
    <button
      type="button"
      title="Delete"
      aria-label={`Delete report: ${title}`}
      disabled={isPending}
      onClick={handleDelete}
      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
