"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { motion } from "motion/react";

export function TrackForm() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      onSubmit={(event) => {
        event.preventDefault();
        const value = trackingId.trim().toLowerCase();
        if (value) router.push(`/track/${encodeURIComponent(value)}`);
      }}
      className="space-y-6"
    >
      <div className="relative">
        <motion.input
          id="tracking-id"
          type="text"
          value={trackingId}
          onChange={(event) => setTrackingId(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`peer w-full px-5 py-3.5 border ${
            focused ? "border-primary" : "border-gray-300"
          } rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 bg-white/90 dark:bg-gray-900/80 placeholder-transparent text-gray-700 dark:text-gray-100`}
          placeholder="Tracking ID"
          autoComplete="off"
          spellCheck={false}
          maxLength={32}
          required
          whileFocus={{ scale: 1.01 }}
        />
        <motion.label
          htmlFor="tracking-id"
          className={`absolute left-5 transition-all duration-200 pointer-events-none ${
            focused || trackingId
              ? "-top-2.5 text-xs bg-white/90 dark:bg-gray-900/80 px-1 text-primary"
              : "top-3.5 text-gray-400"
          }`}
          layout
        >
          Tracking ID
        </motion.label>
        <span className="absolute right-4 top-3.5 text-blue-400 transition-colors duration-200 peer-focus:text-primary">
          <Bell strokeWidth={1.5} className="h-5 w-5" />
        </span>
      </div>

      <motion.button
        type="submit"
        className="w-full px-4 py-3.5 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-lg shadow-md transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 active:scale-[0.98]"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        Track Report
      </motion.button>

      <motion.p
        className="text-center text-sm text-primary dark:text-blue-400"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Enter your 16-character tracking ID
      </motion.p>
    </motion.form>
  );
}
