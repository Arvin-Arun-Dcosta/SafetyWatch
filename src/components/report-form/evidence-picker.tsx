"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, X } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormDescription, FormLabel } from "@/components/ui/form";
import { downscaleToJpeg } from "@/lib/image-resize";
import { MAX_REPORT_IMAGES } from "@/lib/report-meta";
import type { ReportFormValues } from "@/lib/validation";
import { extractReportDetails } from "@/server/ai/extract-details";

/** A photo ready for upload (already downscaled) and its local preview. */
export type EvidenceImage = { file: File; previewUrl: string };

/**
 * Optional evidence photos, plus "Extract Details from Image", which asks the
 * server to draft the title, description and crime type from the first photo.
 */
export function EvidencePicker({
  images,
  onImagesChange,
}: {
  images: EvidenceImage[];
  onImagesChange: (images: EvidenceImage[]) => void;
}) {
  const { setValue } = useFormContext<ReportFormValues>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);

  async function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    const room = MAX_REPORT_IMAGES - images.length;
    if (selected.length === 0 || room <= 0) return;
    if (selected.length > room) {
      toast.warning(`Only ${MAX_REPORT_IMAGES} photos can be attached.`);
    }

    setIsPreparing(true);
    const added: EvidenceImage[] = [];
    for (const original of selected.slice(0, room)) {
      try {
        const file = await downscaleToJpeg(original);
        added.push({ file, previewUrl: URL.createObjectURL(file) });
      } catch {
        toast.error(`"${original.name}" could not be read as an image.`);
      }
    }
    setIsPreparing(false);
    if (added.length > 0) onImagesChange([...images, ...added]);
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(images[index].previewUrl);
    onImagesChange(images.filter((_, i) => i !== index));
  }

  async function extractDetails() {
    const [first] = images;
    if (!first) {
      toast.error("Please upload an image first");
      return;
    }
    setIsAnalysing(true);
    const toastId = toast.loading("Analyzing image for details...");
    try {
      const formData = new FormData();
      formData.set("image", first.file);
      const result = await extractReportDetails(formData);
      if (!result.ok) {
        toast.error(result.error, { id: toastId });
        return;
      }
      const options = { shouldValidate: true, shouldDirty: true };
      setValue("title", result.data.title, options);
      setValue("description", result.data.description, options);
      setValue("crimeType", result.data.crimeType, options);
      toast.success("Details extracted from image", { id: toastId });
    } catch {
      toast.error("Failed to process image", { id: toastId });
    } finally {
      setIsAnalysing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <FormLabel>Upload Evidence (Optional)</FormLabel>
        <div className="flex items-center gap-4 mt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPreparing || images.length >= MAX_REPORT_IMAGES}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            {isPreparing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            Add Photos
          </Button>
          {images.length > 0 && (
            <Button
              type="button"
              variant="outline"
              disabled={isAnalysing}
              onClick={extractDetails}
              className="flex items-center gap-2"
            >
              {isAnalysing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>Extract Details from Image</span>
              )}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            aria-label="Evidence photos"
            onChange={handleFilesSelected}
            className="hidden"
          />
        </div>
        <FormDescription>
          Upload up to {MAX_REPORT_IMAGES} images. Photos are resized before upload.
        </FormDescription>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={image.previewUrl} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                {/* Local object URL: next/image cannot optimise it. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.previewUrl}
                  alt={`Evidence ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove photo ${index + 1}`}
                className="absolute top-1 right-1 p-1 h-6 w-6 bg-white/80 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
