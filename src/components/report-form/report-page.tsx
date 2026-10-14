import { ShieldAlert } from "lucide-react";

import { ReportForm } from "@/components/report-form/report-form";
import { getSessionUser } from "@/lib/session";
import { toInputValues } from "@/server/datetime";

/**
 * Shared body of /reports/new and /reports/anonymous.
 *
 * Signed-in users report under their name unless `forceAnonymous` is set;
 * visitors always report anonymously. Admins review reports and cannot file
 * them (the server action enforces this as well).
 */
export async function ReportPage({ forceAnonymous }: { forceAnonymous: boolean }) {
  const user = await getSessionUser();

  if (user?.role === "ADMIN") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
        <div className="max-w-md text-center space-y-3">
          <ShieldAlert className="h-12 w-12 mx-auto text-red-600" />
          <h1 className="text-2xl font-bold">Admins cannot submit reports</h1>
          <p className="text-muted-foreground">
            Admin accounts review and verify reports. Sign in with a regular account to file one.
          </p>
        </div>
      </div>
    );
  }

  const anonymous = forceAnonymous || !user;
  const now = toInputValues(new Date());

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-2xl">
          <ReportForm
            mode="create"
            anonymous={anonymous}
            reporter={anonymous || !user ? null : { name: user.name, email: user.email }}
            maxDate={now.date}
            defaultCoordinates={null}
            defaults={{
              title: "",
              description: "",
              crimeType: "",
              date: now.date,
              time: now.time,
              address: "",
            }}
          />
        </div>
      </div>
    </div>
  );
}
