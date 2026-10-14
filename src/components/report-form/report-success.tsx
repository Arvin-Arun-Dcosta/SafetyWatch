import Link from "next/link";
import { CircleCheck } from "lucide-react";

export function ReportSuccess({ trackingId }: { trackingId: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative w-full max-w-md p-8 bg-white/90 rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-blue-600 opacity-20 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-primary opacity-20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col items-center">
          <CircleCheck className="w-16 h-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Report Submitted!</h2>
          <p className="text-gray-700 mb-4 text-center">
            Thank you for helping keep our community safe.
          </p>
          <div className="w-full flex flex-col items-center bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <span className="text-xs text-blue-800 font-semibold uppercase tracking-wider">
              Tracking ID
            </span>
            <span
              data-testid="tracking-id"
              className="text-lg font-mono text-blue-900 select-all mt-1 break-all"
            >
              {trackingId}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-2 text-center">
            Please save your Tracking ID to check the status of your report later.
          </p>
          <Link
            href={`/track/${trackingId}`}
            className="mt-4 inline-block px-6 py-2 rounded-lg bg-primary text-white font-semibold shadow hover:bg-blue-700 transition-colors"
          >
            Track Report
          </Link>
        </div>
      </div>
    </div>
  );
}
