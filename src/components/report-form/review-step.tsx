"use client";

import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useFormContext, useWatch } from "react-hook-form";

import type { Coordinates } from "@/components/report-form/report-form";
import { Button } from "@/components/ui/button";
import type { CrimeType } from "@/generated/prisma/enums";
import { CRIME_TYPE_LABELS } from "@/lib/report-meta";
import type { ReportFormValues } from "@/lib/validation";

const notSpecified = <span className="text-gray-400">Not specified</span>;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      {children}
    </div>
  );
}

/** Step 3: read everything back before it is sent. */
export function ReviewStep({
  coordinates,
  reporter,
  previewUrls,
  isSubmitting,
  canSubmit,
  submitLabel,
  onBack,
}: {
  coordinates: Coordinates | null;
  reporter: { name: string; email: string } | null;
  previewUrls: string[];
  isSubmitting: boolean;
  canSubmit: boolean;
  submitLabel: string;
  onBack: () => void;
}) {
  const { control } = useFormContext<ReportFormValues>();
  const values = useWatch({ control });
  const typeLabel = values.crimeType
    ? CRIME_TYPE_LABELS[values.crimeType as CrimeType]
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-primary">Review Your Report</h3>
        <p className="text-base text-gray-600">Please verify all information before submitting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 rounded-lg p-6 shadow-sm border">
          <h4 className="font-semibold text-lg mb-4 text-primary">Incident Details</h4>
          <div className="space-y-3">
            <Field label="Title">
              <p className="font-medium">{values.title || notSpecified}</p>
            </Field>
            <Field label="Type">
              <p className="font-medium">{typeLabel ?? notSpecified}</p>
            </Field>
            <Field label="Description">
              <p className="whitespace-pre-line font-medium text-justify">
                {values.description || notSpecified}
              </p>
            </Field>
            <Field label="Date &amp; Time">
              <p className="font-medium">
                {values.date && values.time
                  ? `${values.date.split("-").reverse().join("/")} at ${values.time}`
                  : notSpecified}
              </p>
            </Field>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 shadow-sm border">
          <h4 className="font-semibold text-lg mb-4 text-primary">Location &amp; Contact</h4>
          <div className="space-y-3">
            <Field label="Address">
              <p className="font-medium">{values.address || notSpecified}</p>
            </Field>
            <Field label="Map Coordinates">
              <p className="font-medium">
                {coordinates
                  ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
                  : notSpecified}
              </p>
            </Field>
            <Field label="Reporting As">
              <p className="font-medium">
                {reporter ? (
                  <>
                    {reporter.name}
                    <br />
                    {reporter.email}
                  </>
                ) : (
                  "Anonymous"
                )}
              </p>
            </Field>
          </div>
        </div>
      </div>

      {previewUrls.length > 0 && (
        <div>
          <h4 className="font-semibold text-lg mb-2 text-primary">Evidence Photos</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {previewUrls.map((url, index) => (
              <div
                key={url}
                className="aspect-square rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center"
              >
                {/* Local object URL: next/image cannot optimise it. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Evidence ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting || !canSubmit} className="gap-2">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </motion.div>
  );
}
