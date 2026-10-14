import "server-only";

/**
 * Evidence photos are downscaled and re-encoded as JPEG in the browser before
 * upload, so the server only ever accepts JPEG. The check looks at the file's
 * leading bytes rather than trusting the declared content type.
 */
export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}
