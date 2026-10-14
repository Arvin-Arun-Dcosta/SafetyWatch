"use client";

import { AnimatePresence, motion } from "motion/react";

/**
 * Decorative dots. Positions come from the index rather than Math.random so
 * the server and client render the same markup.
 */
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  size: 5 + ((i * 7) % 10),
  duration: 10 + ((i * 3) % 10),
}));

/** The animated backdrop and glass card shared by the login and register pages. */
export function AuthShell({
  icon,
  title,
  titleClassName,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  titleClassName: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 overflow-hidden"
      >
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-20" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-20" />
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-20" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-0 right-0 w-full h-full pointer-events-none"
      >
        {PARTICLES.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-400/10 dark:bg-blue-400/5"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
            }}
            animate={{ y: [0, -20, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: particle.duration, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </motion.div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <AnimatePresence>
          <motion.div
            key="auth-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md p-8 space-y-8 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl dark:bg-gray-900/90 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {icon}
                <h1 className={`mt-6 text-3xl font-bold tracking-tight ${titleClassName}`}>
                  {title}
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
              </motion.div>
            </div>
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
