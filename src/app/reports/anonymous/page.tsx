import type { Metadata } from "next";

import { ReportPage } from "@/components/report-form/report-page";

export const metadata: Metadata = { title: "Report Anonymously" };

export default function AnonymousReportPage() {
  return <ReportPage forceAnonymous />;
}
