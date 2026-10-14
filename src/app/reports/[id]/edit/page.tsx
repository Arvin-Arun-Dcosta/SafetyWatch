import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReportForm } from "@/components/report-form/report-form";
import { requireUser } from "@/lib/session";
import { reportIdSchema } from "@/lib/validation";
import { toInputValues } from "@/server/datetime";
import { getEditableReport } from "@/server/reports/queries";

export const metadata: Metadata = { title: "Edit Report" };

/** Owners can edit their own report until an admin starts reviewing it. */
export default async function EditReportPage({ params }: PageProps<"/reports/[id]/edit">) {
  const user = await requireUser();
  const { id } = await params;
  const parsedId = reportIdSchema.safeParse(id);
  const report = parsedId.success ? await getEditableReport(parsedId.data, user.id) : null;
  if (!report) notFound();

  const incident = toInputValues(report.incidentAt);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-2xl">
          <ReportForm
            mode="edit"
            reportId={report.id}
            reporter={{ name: user.name, email: user.email }}
            maxDate={toInputValues(new Date()).date}
            defaultCoordinates={{ lat: report.latitude, lng: report.longitude }}
            defaults={{
              title: report.title,
              description: report.description,
              crimeType: report.crimeType,
              date: incident.date,
              time: incident.time,
              address: report.location,
            }}
          />
        </div>
      </div>
    </div>
  );
}
