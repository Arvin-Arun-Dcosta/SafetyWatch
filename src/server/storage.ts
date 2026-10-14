import "server-only";

import { del, get, put } from "@vercel/blob";

import { env } from "@/lib/env";

/**
 * Evidence photos live in a private Vercel Blob store. Only the blob URL is
 * kept in the database, and the URL is never sent to the browser: photos are
 * served through /reports/[id]/images/[index], which checks who is asking.
 */

const token = env.BLOB_READ_WRITE_TOKEN;

/** Uploads one JPEG and returns its blob URL. */
export async function storeReportImage(folder: string, index: number, bytes: Buffer): Promise<string> {
  const blob = await put(`reports/${folder}/${index + 1}.jpg`, bytes, {
    access: "private",
    addRandomSuffix: true,
    contentType: "image/jpeg",
    token,
  });
  return blob.url;
}

export function readReportImage(url: string, ifNoneMatch?: string) {
  return get(url, { access: "private", ifNoneMatch, token });
}

export async function deleteReportImages(urls: string[]): Promise<void> {
  if (urls.length > 0) await del(urls, { token });
}
