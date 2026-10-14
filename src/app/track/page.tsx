import type { Metadata } from "next";

import { TrackForm } from "@/components/track/track-form";
import { TrackShell } from "@/components/track/track-shell";

export const metadata: Metadata = { title: "Track Your Report" };

export default function TrackReportEntryPage() {
  return (
    <TrackShell>
      <TrackForm />
    </TrackShell>
  );
}
