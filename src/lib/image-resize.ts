import { MAX_IMAGE_BYTES } from "@/lib/report-meta";

/**
 * Browser-only. Downscales a photo and re-encodes it as JPEG so that three of
 * them fit in one server action request. Re-encoding through a canvas also
 * drops EXIF metadata such as the GPS position of the camera.
 */

const MAX_DIMENSION = 1600;

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function downscaleToJpeg(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    // Lower the quality first, then the dimensions, until the file fits.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is not available.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.7, 0.55]) {
        const blob = await canvasToJpeg(canvas, quality);
        if (blob && blob.size <= MAX_IMAGE_BYTES) {
          const name = file.name.replace(/\.[^.]+$/, "") || "photo";
          return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
        }
      }
      scale *= 0.75;
    }
    throw new Error("Could not make this image small enough.");
  } finally {
    bitmap.close();
  }
}
