"use client";

import { motion } from "motion/react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CRIME_TYPE_LABELS, CRIME_TYPES } from "@/lib/report-meta";
import type { ReportFormValues } from "@/lib/validation";

/** Step 1: what happened and when. `children` is the evidence picker. */
export function DetailsStep({
  maxDate,
  canContinue,
  onContinue,
  children,
}: {
  maxDate: string;
  canContinue: boolean;
  onContinue: () => void;
  children?: React.ReactNode;
}) {
  const { control, trigger } = useFormContext<ReportFormValues>();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Incident Title*</FormLabel>
            <FormControl>
              <Input
                placeholder="Brief title describing the incident"
                className="focus:ring-2 focus:ring-primary/50"
                maxLength={120}
                {...field}
              />
            </FormControl>
            <FormDescription>Be concise but descriptive</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="crimeType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type of Crime*</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="focus:ring-2 focus:ring-primary/50">
                  <SelectValue placeholder="Select crime type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CRIME_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {CRIME_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Detailed Description*</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Provide a detailed account of what happened..."
                className="min-h-[150px] focus:ring-2 focus:ring-primary/50"
                maxLength={5000}
                {...field}
              />
            </FormControl>
            <FormDescription>
              Include date, time, people involved, and any other relevant details
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Incident*</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  max={maxDate}
                  className="focus:ring-2 focus:ring-primary/50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Approximate Time*</FormLabel>
              <FormControl>
                <Input type="time" className="focus:ring-2 focus:ring-primary/50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {children}

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          className="ml-auto"
          disabled={!canContinue}
          onClick={async () => {
            const valid = await trigger(["title", "crimeType", "description", "date", "time"]);
            if (valid) onContinue();
          }}
        >
          Continue to Location
        </Button>
      </div>
    </motion.div>
  );
}
