import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, FileText, Image as ImageIcon, MapPin, Pencil, Tag, User } from "lucide-react";
import * as motion from "motion/react-client";

import { ReportLocationMapLoader } from "@/components/maps/report-location-map-loader";
import { EvidenceGallery } from "@/components/report/evidence-gallery";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CRIME_TYPE_LABELS } from "@/lib/report-meta";
import { getSessionUser } from "@/lib/session";
import { reportIdSchema } from "@/lib/validation";
import { formatDate, formatTime } from "@/server/datetime";
import { getReportForViewer } from "@/server/reports/queries";

export const metadata: Metadata = { title: "Report Details" };

function fadeUp(delay: number) {
  return {
    initial: { y: 10, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.3, delay },
  };
}

export default async function ReportDetailsPage({ params }: PageProps<"/reports/[id]">) {
  const { id } = await params;
  const parsedId = reportIdSchema.safeParse(id);
  const viewer = await getSessionUser();
  // Returns null both for unknown ids and for reports this viewer may not see.
  const report = parsedId.success ? await getReportForViewer(parsedId.data, viewer) : null;

  if (!report) {
    return (
      <div className="py-10 mx-auto max-w-[95%] text-center">
        <h2 className="text-2xl font-semibold mb-4">Report Not Found</h2>
        <p className="text-gray-500">
          The requested crime report does not exist or is no longer available.
        </p>
      </div>
    );
  }

  const incident = `${formatDate(report.incidentAt)} ${formatTime(report.incidentAt)}`;

  return (
    <div className="container py-10 mx-auto max-w-[95%]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-6"
      >
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col md:flex-row justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{report.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <StatusBadge status={report.status} />
              <div className="text-sm text-muted-foreground">
                Reported on {formatDate(report.createdAt)} {formatTime(report.createdAt)}
              </div>
            </div>
          </div>
          {report.viewerCanEdit && (
            <Button asChild variant="outline" className="self-start">
              <Link href={`/reports/${report.id}/edit`}>
                <Pencil />
                Edit Report
              </Link>
            </Button>
          )}
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <motion.div {...fadeUp(0.2)}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Incident Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium flex items-center gap-2 text-muted-foreground">
                      Description
                    </h3>
                    <p className="mt-2 whitespace-pre-line text-justify">{report.description}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-1">
                      <h3 className="font-medium flex items-center gap-2 text-muted-foreground">
                        <Tag className="h-4 w-4" /> Crime Type
                      </h3>
                      <p className="text-sm">{CRIME_TYPE_LABELS[report.crimeType]}</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" /> Date Occurred
                      </h3>
                      <p className="text-sm">{incident}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeUp(0.3)}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> Incident Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{report.location}</p>
                  </div>
                  <div className="h-[300px] rounded-md overflow-hidden border">
                    <ReportLocationMapLoader lat={report.latitude} lng={report.longitude} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {report.imageCount > 0 && (
              <motion.div {...fadeUp(0.4)}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" /> Evidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EvidenceGallery reportId={report.id} count={report.imageCount} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <motion.div {...fadeUp(0.2)}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Case Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Current Status</h3>
                    <div className="pt-1">
                      <StatusBadge status={report.status} />
                    </div>
                  </div>

                  {report.actionDetails && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Investigator Notes
                      </h3>
                      <p className="text-sm mt-1 whitespace-pre-line">{report.actionDetails}</p>
                    </div>
                  )}

                  {report.trackingId && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Tracking ID</h3>
                      <p className="text-sm font-mono break-all">{report.trackingId}</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                    <p className="text-sm">
                      {formatDate(report.updatedAt)} {formatTime(report.updatedAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeUp(0.3)}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Reporter Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.isAnonymous ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Anonymous Report</span>
                    </div>
                  ) : report.reporter ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{report.reporter.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Contact: {report.reporter.email}
                      </div>
                    </div>
                  ) : (
                    // Names and contact details are only shown to the reporter and admins.
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Registered user</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
