import "server-only";

import { env } from "@/lib/env";

/**
 * Date handling. Incidents are stored as instants (timestamptz) and are
 * entered and displayed as wall-clock time in APP_TIME_ZONE, so a report reads
 * the same for everyone and "by hour of day" statistics mean local time.
 */

const TIME_ZONE = env.APP_TIME_ZONE;

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function zonedParts(instant: Date) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(instant).map((part) => [part.type, part.value]),
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

/** Offset of APP_TIME_ZONE from UTC at the given instant, in milliseconds. */
function offsetAt(instant: Date): number {
  const p = zonedParts(instant);
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * Converts form values ("2026-10-11", "14:30") in APP_TIME_ZONE to an
 * instant. Returns null for impossible dates such as 2026-02-31.
 */
export function parseZonedDateTime(date: string, time: string): Date | null {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wallClock = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(wallClock);
  if (
    Number.isNaN(wallClock) ||
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day ||
    check.getUTCHours() !== hour ||
    check.getUTCMinutes() !== minute
  ) {
    return null;
  }
  // Two passes handle instants next to a daylight-saving change.
  let instant = wallClock - offsetAt(new Date(wallClock));
  instant = wallClock - offsetAt(new Date(instant));
  return new Date(instant);
}

/** Values for `<input type="date">` and `<input type="time">`. */
export function toInputValues(instant: Date): { date: string; time: string } {
  const p = zonedParts(instant);
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/** "11/10/2026" */
export function formatDate(instant: Date): string {
  const p = zonedParts(instant);
  return `${p.day}/${p.month}/${p.year}`;
}

/** "14:30" */
export function formatTime(instant: Date): string {
  const p = zonedParts(instant);
  return `${p.hour}:${p.minute}`;
}

/** "11/10/2026 • 14:30" */
export function formatDateTime(instant: Date): string {
  return `${formatDate(instant)} • ${formatTime(instant)}`;
}

export const APP_TIME_ZONE = TIME_ZONE;
