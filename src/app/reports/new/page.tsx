import type { Metadata } from "next";

import { ReportPage } from "@/components/report-form/report-page";

export const metadata: Metadata = { title: "Report Crime" };

export default function ReportCrimePage() {
  return <ReportPage forceAnonymous={false} />;
}
