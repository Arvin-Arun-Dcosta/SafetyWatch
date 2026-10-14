import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, CircleAlert, Clock, Info, MapPin } from "lucide-react";
import * as motion from "motion/react-client";

import { TrackShell } from "@/components/track/track-shell";
import { StatusBadge } from "@/components/status-badge";
import { getSessionUser } from "@/lib/session";
import { trackingIdSchema } from "@/lib/validation";
import { formatDate, formatTime } from "@/server/datetime";
import { getReportByTrackingId } from "@/server/reports/queries";

export const metadata: Metadata = {
  title: "Track Your Report",
  // Tracking pages are personal; keep them out of search engines.
  robots: { index: false },
};

const STATUS_MESSAGES = {
  PENDING: "Your report has been received and is waiting for an admin to review it.",
  REVIEWING: "An admin is reviewing your report.",
  VERIFIED: "Your report has been verified and is now visible on the public map and lists.",
  RESOLVED: "Your report has been verified and marked as resolved.",
  REJECTED: "Your report could not be verified and has been closed.",
};

const primaryLink =
  "block w-full text-center px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1";

export default async function TrackReportPage({ params }: PageProps<"/track/[id]">) {
  const { id } = await params;
  const trackingId = trackingIdSchema.safeParse(decodeURIComponent(id));
  // One indexed lookup by tracking ID; nothing else is loaded.
  const report = trackingId.success
    ? await getReportByTrackingId(trackingId.data, await getSessionUser())
    : null;

  if (!report) {
    return (
      <TrackShell>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center py-8 space-y-4"
        >
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
            <CircleAlert
              strokeWidth={1.5}
              className="h-8 w-8 text-yellow-500 dark:text-yellow-400"
            />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Report Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm break-all">
              No report found with ID: {decodeURIComponent(id).slice(0, 64)}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Please verify your tracking ID and try again
            </p>
          </div>
          <Link
            href="/track"
            className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-base rounded-lg transition-colors duration-200"
          >
            ← Try another ID
          </Link>
        </motion.div>
      </TrackShell>
    );
  }

  return (
    <TrackShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <motion.div
          whileHover={{ y: -5 }}
          className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all"
        >
          <div className="p-6 space-y-5">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white line-clamp-2 pr-2">
                {report.title}
              </h2>
              <StatusBadge status={report.status} className="shrink-0" />
            </div>

            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-3">
              <span className="flex items-center">
                <Calendar strokeWidth={1.5} className="h-4 w-4 mr-1" />
                {formatDate(report.incidentAt)}
              </span>
              <span className="flex items-center">
                <Clock strokeWidth={1.5} className="h-4 w-4 mr-1" />
                {formatTime(report.incidentAt)}
              </span>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">
                {report.description}
              </p>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center">
                <MapPin strokeWidth={1.5} className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <span>{report.location}</span>
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-700/30">
            <div className="flex flex-col space-y-3">
              {report.detailsId && (
                <Link href={`/reports/${report.detailsId}`} className={primaryLink}>
                  View Full Details
                </Link>
              )}
              <Link
                href="/track"
                className="w-full text-center text-primary hover:text-primary/90 text-base font-bold transition-colors duration-200"
              >
                Track another report
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-start">
            <Info
              strokeWidth={1.5}
              className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0"
            />
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Report Status Information
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {STATUS_MESSAGES[report.status]} Check this page again with your tracking ID to
                see updates.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </TrackShell>
  );
}
