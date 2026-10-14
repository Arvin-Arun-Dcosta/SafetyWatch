"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "motion/react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { DetailsStep } from "@/components/report-form/details-step";
import { type EvidenceImage, EvidencePicker } from "@/components/report-form/evidence-picker";
import { LocationStep } from "@/components/report-form/location-step";
import { ReportSuccess } from "@/components/report-form/report-success";
import { ReviewStep } from "@/components/report-form/review-step";
import { type FormStep, StepIndicator } from "@/components/report-form/step-indicator";
import { Form } from "@/components/ui/form";
import { forwardGeocode, getCurrentPosition, reverseGeocode } from "@/lib/geocoding";
import { type ReportFormValues, reportFieldsSchema } from "@/lib/validation";
import { createReport, updateReport } from "@/server/reports/actions";

export type Coordinates = { lat: number; lng: number };

type ReportFormProps = {
  /** Field values to start from (the current time, or the report being edited). */
  defaults: ReportFormValues;
  defaultCoordinates: Coordinates | null;
  /** Latest selectable date ("today" in the app's time zone). */
  maxDate: string;
  /** Shown on the review step. Null when the report will be anonymous. */
  reporter: { name: string; email: string } | null;
} & ({ mode: "create"; anonymous: boolean } | { mode: "edit"; reportId: string });

const detailsSchema = reportFieldsSchema.pick({
  title: true,
  description: true,
  crimeType: true,
  date: true,
  time: true,
});
const addressSchema = reportFieldsSchema.pick({ address: true });

const DETAIL_FIELDS = ["title", "description", "crimeType", "date", "time"] as const;
const FORM_FIELDS = [...DETAIL_FIELDS, "address"] as const;

/**
 * The three-step report form (details → location → review). This component
 * owns the state and submission; each step is its own file.
 */
export function ReportForm(props: ReportFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<FormStep>("details");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(props.defaultCoordinates);
  const [city, setCity] = useState<string | null>(null);
  const [images, setImages] = useState<EvidenceImage[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFieldsSchema),
    mode: "onChange",
    defaultValues: props.defaults,
  });
  const values = useWatch({ control: form.control });

  const detailsComplete = detailsSchema.safeParse(values).success;
  const locationComplete = addressSchema.safeParse(values).success && coordinates !== null;

  // Address lookups resolve out of order; only the latest one may write.
  const lookupId = useRef(0);

  /** Sets the pin, then fills in the address for it in the background. */
  async function moveTo(next: Coordinates, fallbackAddress: string) {
    const id = ++lookupId.current;
    setCoordinates(next);
    setCity(null);
    form.setValue("address", fallbackAddress, { shouldValidate: true });
    const result = await reverseGeocode(next.lat, next.lng);
    if (result && id === lookupId.current) {
      form.setValue("address", result.address.slice(0, 300), { shouldValidate: true });
      setCity(result.city);
    }
  }

  // New reports start at the reporter's own position when the browser allows it.
  const isCreate = props.mode === "create";
  useEffect(() => {
    if (!isCreate) return;
    getCurrentPosition({ maximumAge: 60000, timeout: 3000 })
      .then(({ coords }) => {
        if (form.getValues("address")) return;
        void moveTo(
          { lat: coords.latitude, lng: coords.longitude },
          `Near ${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`,
        );
      })
      .catch(() => {
        // No permission or no fix: the reporter picks the location by hand.
      });
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Release preview URLs when the form goes away.
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => () => imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)), []);

  function handleMapPick(lat: number, lng: number) {
    void moveTo({ lat, lng }, `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  }

  async function handleLocate() {
    setIsLocating(true);
    const toastId = toast.loading("Getting your current location...");
    try {
      const { coords } = await getCurrentPosition({ maximumAge: 60000, timeout: 5000 });
      await moveTo(
        { lat: coords.latitude, lng: coords.longitude },
        `Near ${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`,
      );
      toast.success("Location updated to your current position", { id: toastId });
    } catch {
      toast.error("Unable to get your current position", { id: toastId });
    } finally {
      setIsLocating(false);
    }
  }

  /** A typed address moves the pin to the best match. */
  async function handleAddressBlur(address: string) {
    if (address.trim().length <= 5) return;
    const id = ++lookupId.current;
    const result = await forwardGeocode(address);
    if (id !== lookupId.current) return;
    if (result) {
      setCoordinates({ lat: result.lat, lng: result.lng });
      setCity(result.city);
    } else if (!coordinates) {
      toast.error("Could not find that address. Click the map to set the location.");
    }
  }

  async function handleSubmit(formValues: ReportFormValues) {
    if (!coordinates) {
      setStep("location");
      toast.error("Please select the location on the map.");
      return;
    }

    const formData = new FormData();
    for (const field of FORM_FIELDS) formData.set(field, formValues[field]);
    formData.set("latitude", String(coordinates.lat));
    formData.set("longitude", String(coordinates.lng));
    if (city) formData.set("city", city);

    setIsSubmitting(true);
    try {
      let result;
      if (props.mode === "create") {
        formData.set("anonymous", String(props.anonymous));
        for (const image of images) formData.append("images", image.file);
        result = await createReport(formData);
      } else {
        result = await updateReport(props.reportId, formData);
      }

      if (!result.ok) {
        showServerErrors(result.fieldErrors);
        toast.error(result.error);
        return;
      }

      if ("trackingId" in result.data) {
        images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        setImages([]);
        setTrackingId(result.data.trackingId);
      } else {
        toast.success("Report updated.");
        router.push(`/reports/${result.data.id}`);
        router.refresh();
      }
    } catch {
      toast.error("Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  }

  /** Puts server-side validation messages on the fields and opens their step. */
  function showServerErrors(fieldErrors: Record<string, string[]> | undefined) {
    if (!fieldErrors) return;
    for (const field of FORM_FIELDS) {
      const message = fieldErrors[field]?.[0];
      if (message) form.setError(field, { message });
    }
    if (DETAIL_FIELDS.some((field) => fieldErrors[field])) setStep("details");
    else if (fieldErrors.address || fieldErrors.latitude || fieldErrors.longitude) {
      setStep("location");
    }
  }

  if (trackingId) {
    return <ReportSuccess trackingId={trackingId} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
      <div className="bg-primary px-8 py-6">
        <h2 className="text-2xl font-bold text-white">
          {props.mode === "create" ? "Crime Incident Report" : "Edit Your Report"}
        </h2>
        <p className="text-primary-foreground/90 mt-1">
          {props.mode === "create"
            ? "Help keep your community safe by reporting criminal activity"
            : "You can change a report until an admin starts reviewing it"}
        </p>
      </div>

      <StepIndicator
        step={step}
        onStepChange={setStep}
        canOpenLocation={detailsComplete}
        canOpenReview={detailsComplete && locationComplete}
      />

      <div className="p-8">
        <Form {...form}>
          <form
            noValidate
            className="space-y-8"
            onSubmit={(event) => {
              // Only the review step submits; earlier steps move on with their own buttons.
              if (step !== "review") {
                event.preventDefault();
                return;
              }
              void form.handleSubmit(handleSubmit)(event);
            }}
            onKeyDown={(event) => {
              const target = event.target as HTMLElement;
              if (event.key === "Enter" && target.tagName !== "TEXTAREA") event.preventDefault();
            }}
          >
            <AnimatePresence mode="wait">
              {step === "details" && (
                <DetailsStep
                  key="details"
                  maxDate={props.maxDate}
                  canContinue={detailsComplete}
                  onContinue={() => setStep("location")}
                >
                  {props.mode === "create" && (
                    <EvidencePicker images={images} onImagesChange={setImages} />
                  )}
                </DetailsStep>
              )}

              {step === "location" && (
                <LocationStep
                  key="location"
                  coordinates={coordinates}
                  isLocating={isLocating}
                  canContinue={locationComplete}
                  onMapPick={handleMapPick}
                  onLocate={handleLocate}
                  onAddressBlur={handleAddressBlur}
                  onBack={() => setStep("details")}
                  onContinue={() => setStep("review")}
                />
              )}

              {step === "review" && (
                <ReviewStep
                  key="review"
                  coordinates={coordinates}
                  reporter={props.reporter}
                  previewUrls={images.map((image) => image.previewUrl)}
                  isSubmitting={isSubmitting}
                  canSubmit={detailsComplete && locationComplete}
                  submitLabel={props.mode === "create" ? "Submit Report" : "Save Changes"}
                  onBack={() => setStep("location")}
                />
              )}
            </AnimatePresence>
          </form>
        </Form>
      </div>
    </div>
  );
}
