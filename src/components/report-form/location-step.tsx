"use client";

import dynamic from "next/dynamic";
import { Loader2, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { useFormContext } from "react-hook-form";

import type { Coordinates } from "@/components/report-form/report-form";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ReportFormValues } from "@/lib/validation";

// Leaflet needs `window`, so the picker is only rendered in the browser.
const LocationPicker = dynamic(() => import("@/components/maps/location-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
});

/** Step 2: where it happened, by map click, current position or typed address. */
export function LocationStep({
  coordinates,
  isLocating,
  canContinue,
  onMapPick,
  onLocate,
  onAddressBlur,
  onBack,
  onContinue,
}: {
  coordinates: Coordinates | null;
  isLocating: boolean;
  canContinue: boolean;
  onMapPick: (lat: number, lng: number) => void;
  onLocate: () => void;
  onAddressBlur: (address: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { control } = useFormContext<ReportFormValues>();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <FormLabel>Incident Location*</FormLabel>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Click on the map or enter address below</span>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm relative">
        <LocationPicker position={coordinates} onPick={onMapPick} />
        <button
          type="button"
          disabled={isLocating}
          title="Return to my current location"
          aria-label="Use my current location"
          className={`group absolute z-10 bottom-4 right-4 bg-white border border-gray-300 shadow-lg rounded-full p-3 hover:bg-primary hover:text-white transition-all duration-200 flex items-center justify-center ${
            isLocating ? "opacity-70 cursor-not-allowed" : ""
          }`}
          onClick={onLocate}
        >
          {isLocating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MapPin className="h-6 w-6 text-gray-700 group-hover:text-white" />
          )}
        </button>
      </div>

      <FormField
        control={control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                placeholder="Enter address or click the map"
                aria-label="Address"
                className="focus:ring-2 focus:ring-primary/50"
                maxLength={300}
                {...field}
                onBlur={(event) => {
                  field.onBlur();
                  onAddressBlur(event.target.value);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" className="ml-auto" disabled={!canContinue} onClick={onContinue}>
          Review Report
        </Button>
      </div>
    </motion.div>
  );
}
