import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";

import { Pagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { pageParamSchema } from "@/lib/validation";
import { formatDateTime } from "@/server/datetime";
import { listUserReports } from "@/server/reports/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin/dashboard");

  const { page } = await searchParams;
  const reports = await listUserReports(user.id, pageParamSchema.parse(page));

  return (
    <div className="mx-auto mt-10 max-w-[95%] px-4 mb-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your Dashboard</h1>
        <Button asChild>
          <Link href="/reports/new">Report New Incident</Link>
        </Button>
      </div>

      {reports.total === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 text-center">
            <p className="text-muted-foreground">You have not submitted any reports yet.</p>
            <Button asChild className="mt-4">
              <Link href="/reports/new">Create Your First Report</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 px-2">
            {reports.items.map((report) => (
              <div key={report.id} className="group transition-all duration-200">
                <Card className="flex flex-col h-full border border-blue-900/60 shadow-md px-6 py-6 group-hover:scale-[1.03] group-hover:shadow-lg group-hover:border-blue-900 transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{report.title}</CardTitle>
                    <CardDescription>
                      <span>{formatDateTime(report.incidentAt)}</span>
                      <span className="block mt-2">
                        <StatusBadge status={report.status} />
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow pt-4 pb-4">
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {report.description}
                    </p>
                    <p className="mt-4 text-sm">
                      <strong>Location:</strong> {report.location}
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-4">
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 border-blue-700 bg-blue-50 text-blue-900 hover:bg-blue-100 hover:border-blue-900 transition-colors"
                    >
                      <Link href={`/reports/${report.id}`}>View Details</Link>
                    </Button>
                    {report.status === "PENDING" && (
                      <Button
                        asChild
                        variant="outline"
                        title="Edit"
                        className="border-blue-700 text-blue-900 hover:bg-blue-50"
                      >
                        <Link href={`/reports/${report.id}/edit`} aria-label={`Edit ${report.title}`}>
                          <Pencil className="w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
          <Pagination
            page={reports.page}
            pageCount={reports.pageCount}
            hrefFor={(p) => (p > 1 ? `/dashboard?page=${p}` : "/dashboard")}
            label="Your report pages"
            className="mt-10"
          />
        </>
      )}
    </div>
  );
}
