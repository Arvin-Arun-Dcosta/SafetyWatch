"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Evidence thumbnails with a click-to-enlarge overlay. The photos come from
 * /reports/[id]/images/[index], which checks access on every request, so
 * plain <img> is used instead of the (unauthenticated) image optimiser.
 */
export function EvidenceGallery({ reportId, count }: { reportId: string; count: number }) {
  const [active, setActive] = useState<number | null>(null);
  const src = (index: number) => `/reports/${reportId}/images/${index}`;

  useEffect(() => {
    if (active === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: count }, (_, index) => (
          <motion.button
            key={index}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label={`Enlarge evidence photo ${index + 1}`}
            className="relative aspect-square rounded-md overflow-hidden border cursor-pointer"
            onClick={() => setActive(index)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src(index)}
              alt={`Evidence ${index + 1}`}
              loading="lazy"
              className="object-cover w-full h-full"
            />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Enlarged evidence photo"
            className="fixed inset-0 bg-black/90 z-[2000] flex items-center justify-center p-4"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="relative max-w-4xl w-full max-h-[90vh]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src(active)}
                alt={`Evidence ${active + 1}, enlarged`}
                className="w-full h-full max-h-[90vh] object-contain"
              />
              <button
                type="button"
                aria-label="Close"
                className="absolute top-4 right-4 bg-black/50 rounded-full p-2 text-white hover:bg-black/80 transition-colors"
                onClick={(event) => {
                  event.stopPropagation();
                  setActive(null);
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
