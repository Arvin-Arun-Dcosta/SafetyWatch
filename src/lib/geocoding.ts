import { z } from "zod";

/**
 * Address lookup through OpenStreetMap's Nominatim, called from the browser
 * by the report form. Failures are returned as null: geocoding is a
 * convenience and must never block a report.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org";
const TIMEOUT_MS = 4000;

const addressSchema = z
  .object({
    city: z.string(),
    town: z.string(),
    village: z.string(),
    municipality: z.string(),
    county: z.string(),
    state_district: z.string(),
  })
  .partial();

const reverseSchema = z.object({
  display_name: z.string(),
  address: addressSchema.optional(),
});

const searchSchema = z.array(
  z.object({
    lat: z.coerce.number(),
    lon: z.coerce.number(),
    address: addressSchema.optional(),
  }),
);

function cityOf(address: z.infer<typeof addressSchema> | undefined): string | null {
  if (!address) return null;
  return (
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county ??
    address.state_district ??
    null
  );
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Nominatim responded with ${response.status}`);
  return response.json();
}

export type ReverseGeocodeResult = { address: string; city: string | null };

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  try {
    const data = await getJson(
      `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
    );
    const parsed = reverseSchema.safeParse(data);
    if (!parsed.success) return null;
    return { address: parsed.data.display_name, city: cityOf(parsed.data.address) };
  } catch {
    return null;
  }
}

export type ForwardGeocodeResult = { lat: number; lng: number; city: string | null };

export async function forwardGeocode(query: string): Promise<ForwardGeocodeResult | null> {
  try {
    const data = await getJson(
      `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
    );
    const parsed = searchSchema.safeParse(data);
    if (!parsed.success || parsed.data.length === 0) return null;
    const [first] = parsed.data;
    return { lat: first.lat, lng: first.lon, city: cityOf(first.address) };
  } catch {
    return null;
  }
}

/** Promise wrapper around the browser geolocation API. */
export function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}
