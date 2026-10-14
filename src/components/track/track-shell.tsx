import { Shield } from "lucide-react";
import * as motion from "motion/react-client";

const BLOBS = [
  {
    className: "top-1/4 left-1/4 bg-blue-200",
    animate: { scale: [1, 1.1, 1], x: [0, 30, 0], y: [0, -20, 0] },
    transition: { duration: 8, delay: 0 },
  },
  {
    className: "top-1/3 right-1/4 bg-purple-200",
    animate: { scale: [1, 1.1, 1], x: [0, -20, 0], y: [0, 20, 0] },
    transition: { duration: 10, delay: 2 },
  },
  {
    className: "bottom-1/4 left-1/2 bg-pink-200",
    animate: { scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -20, 0] },
    transition: { duration: 12, delay: 1 },
  },
];

/** Animated backdrop and glass card shared by /track and /track/[id]. */
export function TrackShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {BLOBS.map((blob) => (
            <motion.div
              key={blob.className}
              className={`absolute w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-20 ${blob.className}`}
              animate={blob.animate}
              transition={{ ...blob.transition, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-xl p-8 space-y-8 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl dark:bg-gray-900/90 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50"
          >
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3 mb-8">
              <Shield
                strokeWidth={1.5}
                className="h-8 w-8 text-primary transition-transform hover:scale-110"
              />
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-400">
                Track Your Report
              </h1>
            </motion.div>
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
