"use client";

import { useState } from "react";
import { Archive, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

/** Collapsible wrapper around the (server-rendered) archived reports table. */
export function ArchivedSection({
  count,
  defaultOpen,
  children,
}: {
  count: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-4">
      <button
        type="button"
        aria-expanded={open}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <Archive className="h-4 w-4" />
        {open ? "Hide" : "Show"} Archived Reports ({count})
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden space-y-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
