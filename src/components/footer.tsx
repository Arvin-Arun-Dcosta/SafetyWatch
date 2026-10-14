import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import * as motion from "motion/react-client";

import type { Role } from "@/generated/prisma/enums";

const HOME = { href: "/", label: "Home" };
const MAP = { href: "/reports/map", label: "Crime Map" };

const LINKS_BY_ROLE = {
  ADMIN: [
    HOME,
    MAP,
    { href: "/stats", label: "Statistics" },
    { href: "/admin/dashboard", label: "Admin Dashboard" },
  ],
  USER: [
    HOME,
    { href: "/reports/new", label: "Report Crime" },
    MAP,
    { href: "/dashboard", label: "Dashboard" },
  ],
  GUEST: [
    HOME,
    { href: "/reports/new", label: "Report Crime" },
    { href: "/track", label: "Track" },
    MAP,
  ],
};

/** Fades a footer column in when it scrolls into view, staggered by index. */
function Column({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.05 * index, duration: 0.5 }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}

export function Footer({ role }: { role: Role | null }) {
  const links = LINKS_BY_ROLE[role ?? "GUEST"];

  return (
    <footer className="bg-[#000040] text-white border-t border-blue-900/50">
      <div className="container mx-auto px-6 py-16 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <Column index={0}>
            <div className="flex items-center space-x-2">
              <svg
                className="w-9 h-9 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.0 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
                SafetyWatch
              </span>
            </div>
            <p className="text-blue-200 text-lg leading-relaxed">
              Empowering communities through transparent safety reporting and awareness.
            </p>
          </Column>

          <Column index={1}>
            <h3 className="text-blue-100 font-semibold uppercase tracking-wider text-lg">
              Quick Links
            </h3>
            <ul className="space-y-4">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-blue-300 hover:text-white transition-colors duration-300 text-base flex items-center"
                  >
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Column>

          <Column index={2}>
            <h3 className="text-blue-100 font-semibold uppercase tracking-wider text-lg">Contact</h3>
            <ul className="space-y-4 text-blue-300 text-base">
              <li className="flex items-start">
                <Phone className="w-5 h-5 mt-0.5 mr-2 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-100 text-base">Emergency</p>
                  <p className="text-base">112</p>
                </div>
              </li>
              <li className="flex items-start">
                <Phone className="w-5 h-5 mt-0.5 mr-2 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-100 text-base">Non-Emergency</p>
                  <p className="text-base">100</p>
                </div>
              </li>
              <li className="flex items-start">
                <Mail className="w-5 h-5 mt-0.5 mr-2 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-100 text-base">Email</p>
                  <a
                    href="mailto:info@safetywatch.example"
                    className="hover:text-white transition-colors duration-300 text-base"
                  >
                    info@safetywatch.example
                  </a>
                </div>
              </li>
            </ul>
          </Column>

          <Column index={3}>
            <h3 className="text-blue-100 font-semibold uppercase tracking-wider text-lg">About</h3>
            <p className="text-blue-300 text-lg leading-relaxed">
              SafetyWatch is a community platform dedicated to making neighborhoods safer through
              collaborative reporting.
            </p>
          </Column>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        viewport={{ once: true }}
        className="bg-[#23233a] h-14 border-t border-blue-900/50 w-full flex flex-col md:flex-row justify-center items-center text-white text-base px-6 mt-0 md:mt-8"
      >
        <div className="flex flex-col md:flex-row items-center justify-center w-full gap-0">
          <span>© {new Date().getFullYear()} SafetyWatch. All rights reserved.</span>
          <span className="md:ml-2">By Arvin Arun Dcosta</span>
        </div>
      </motion.div>
    </footer>
  );
}
