"use client";

import Link from "next/link";
import { toast } from "sonner";

const cardClasses =
  "flex flex-col flex-1 items-center space-y-4 border border-red-200 p-6 rounded-xl bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-2 group min-h-[240px] min-w-0";

/**
 * The "AI-Powered Reports" card on the home page. Admins cannot file reports,
 * so for them it explains that instead of linking to the form.
 */
export function ReportFeatureCard({
  blocked,
  children,
}: {
  blocked: boolean;
  children: React.ReactNode;
}) {
  if (blocked) {
    return (
      <button
        type="button"
        aria-disabled="true"
        onClick={() => toast.error("Admins cannot submit reports.")}
        className={`${cardClasses} cursor-not-allowed`}
      >
        {children}
      </button>
    );
  }
  return (
    <Link href="/reports/anonymous" className={cardClasses}>
      {children}
    </Link>
  );
}
