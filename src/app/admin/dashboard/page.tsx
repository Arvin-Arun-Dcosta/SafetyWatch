import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronDown, CircleAlert, Eye } from "lucide-react";
import * as motion from "motion/react-client";

import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { ArchivedSection } from "@/components/admin/archived-section";
import { DeleteReportButton } from "@/components/admin/delete-report-button";
import { ExpandableCell } from "@/components/admin/expandable-cell";
import { StatusSelect } from "@/components/admin/status-select";
import { Pagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type AdminSearch, adminHref, adminSearchSchema } from "@/lib/admin-search";
import { CRIME_TYPE_LABELS } from "@/lib/report-meta";
import { requireAdmin } from "@/lib/session";
import { formatDate, formatTime } from "@/server/datetime";
import { type AdminReportListItem, listAdminReports } from "@/server/reports/queries";

export const metadata: Metadata = { title: "Admin Dashboard" };

const rowClasses =
  "hover:bg-gray-50 data-[state=selected]:bg-muted border-b transition-colors group";

/** Column header that sorts the active table; clicking again flips the direction. */
function SortableHead({
  search,
  field,
  className,
  children,
}: {
  search: AdminSearch;
  field: AdminSearch["sort"];
  className?: string;
  children: React.ReactNode;
}) {
  const active = search.sort === field;
  const nextDir = active && search.dir === "desc" ? "asc" : "desc";
  return (
    <TableHead
      className={`font-medium hover:bg-gray-100 transition-colors ${className ?? ""}`}
      aria-sort={active ? (search.dir === "asc" ? "ascending" : "descending") : undefined}
    >
      <Link
        href={adminHref(search, { sort: field, dir: nextDir, page: 1 })}
        scroll={false}
        className="flex items-center"
      >
        {children}
        {!active ? (
          <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
        ) : search.dir === "asc" ? (
          <ArrowUp className="ml-1 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-1 h-4 w-4" />
        )}
      </Link>
    </TableHead>
  );
}

function ReportRow({
  report,
  showEmail,
  archived,
}: {
  report: AdminReportListItem;
  showEmail: boolean;
  archived: boolean;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: archived ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={rowClasses}
    >
      <TableCell className="min-w-[100px] max-w-[130px] truncate">
        {CRIME_TYPE_LABELS[report.crimeType]}
      </TableCell>
      <ExpandableCell className="font-medium max-w-[180px]">{report.title}</ExpandableCell>
      <ExpandableCell className="max-w-[260px]">{report.location}</ExpandableCell>
      <ExpandableCell className="font-mono text-sm min-w-[110px] max-w-[130px]">
        {report.trackingId}
      </ExpandableCell>
      {showEmail && (
        <ExpandableCell className="max-w-[180px]">{report.reporterEmail ?? "-"}</ExpandableCell>
      )}
      <TableCell>
        {formatDate(report.incidentAt)} at {formatTime(report.incidentAt)}
      </TableCell>
      <TableCell>
        {archived ? (
          <StatusBadge status={report.status} />
        ) : (
          <StatusSelect reportId={report.id} status={report.status} />
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Link
            href={`/reports/${report.id}`}
            title="View Details"
            aria-label={`View details: ${report.title}`}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <DeleteReportButton reportId={report.id} title={report.title} />
        </div>
      </TableCell>
    </motion.tr>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: PageProps<"/admin/dashboard">) {
  await requireAdmin();

  const search = adminSearchSchema.parse(await searchParams);
  const [active, archived] = await Promise.all([
    listAdminReports(search, { archived: false, page: search.page }),
    listAdminReports(search, { archived: true, page: search.apage }),
  ]);
  const showEmail = search.reporter === "authenticated";

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage and review submitted crime reports</p>
          </div>
          <AdminToolbar search={search} />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Active Reports
            <span className="ml-2 text-sm font-normal text-gray-500">({active.total})</span>
          </h2>

          {active.total === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl">
              <CircleAlert className="h-8 w-8 text-gray-400 mb-3" />
              <p className="text-gray-500">No active reports found</p>
            </div>
          ) : (
            <>
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <SortableHead search={search} field="type" className="min-w-[100px]">
                        Type
                      </SortableHead>
                      <TableHead className="font-medium min-w-[180px]">Title</TableHead>
                      <TableHead className="font-medium min-w-[260px]">Location</TableHead>
                      <TableHead className="font-medium min-w-[110px]">Tracking ID</TableHead>
                      {showEmail && (
                        <TableHead className="font-medium min-w-[180px]">Reporter Email</TableHead>
                      )}
                      <SortableHead search={search} field="date" className="min-w-[180px]">
                        Date and Time Occurred
                      </SortableHead>
                      <SortableHead search={search} field="status" className="min-w-[140px]">
                        Status
                      </SortableHead>
                      <TableHead className="font-medium min-w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {active.items.map((report) => (
                      <ReportRow
                        key={report.id}
                        report={report}
                        showEmail={showEmail}
                        archived={false}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                page={active.page}
                pageCount={active.pageCount}
                hrefFor={(page) => adminHref(search, { page })}
                label="Active report pages"
              />
            </>
          )}
        </div>

        {archived.total > 0 && (
          <ArchivedSection count={archived.total} defaultOpen={search.apage > 1}>
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-medium min-w-[120px]">Type</TableHead>
                    <TableHead className="font-medium min-w-[180px]">Title</TableHead>
                    <TableHead className="font-medium min-w-[260px]">Location</TableHead>
                    <TableHead className="font-medium min-w-[120px]">Tracking ID</TableHead>
                    {showEmail && (
                      <TableHead className="font-medium min-w-[180px]">Reporter Email</TableHead>
                    )}
                    <TableHead className="font-medium min-w-[150px]">
                      Date and Time Occurred
                    </TableHead>
                    <TableHead className="font-medium min-w-[140px]">Status</TableHead>
                    <TableHead className="font-medium min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archived.items.map((report) => (
                    <ReportRow key={report.id} report={report} showEmail={showEmail} archived />
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination
              page={archived.page}
              pageCount={archived.pageCount}
              hrefFor={(apage) => adminHref(search, { apage })}
              label="Archived report pages"
            />
          </ArchivedSection>
        )}
      </motion.div>
    </div>
  );
}
