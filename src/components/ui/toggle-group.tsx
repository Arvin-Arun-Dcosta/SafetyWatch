"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

const ToggleGroupContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

/** A row of buttons where exactly one is selected. */
function ToggleGroup({
  className,
  value,
  onValueChange,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <ToggleGroupContext.Provider value={{ value, onValueChange }}>
      <div
        role="group"
        className={cn("flex items-center justify-center gap-1", className)}
        {...props}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

function ToggleGroupItem({
  className,
  value,
  children,
  ...props
}: Omit<React.ComponentProps<"button">, "value"> & { value: string }) {
  const context = React.useContext(ToggleGroupContext);
  if (!context) {
    throw new Error("ToggleGroupItem must be used within a ToggleGroup");
  }
  const isSelected = context.value === value;

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={cn(
        buttonVariants({ variant: isSelected ? "default" : "outline" }),
        "hover:bg-muted hover:text-muted-foreground",
        isSelected && "bg-primary text-primary-foreground",
        className,
      )}
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export { ToggleGroup, ToggleGroupItem };
