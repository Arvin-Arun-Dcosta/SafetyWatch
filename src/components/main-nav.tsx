"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Role } from "@/generated/prisma/enums";
import { authClient } from "@/lib/auth-client";

type NavUser = { name: string; email: string; role: Role };

const GUEST_ITEMS = [
  { href: "/reports/new", label: "Report Crime" },
  { href: "/track", label: "Track" },
  { href: "/crimes", label: "Crime Reports" },
  { href: "/reports/map", label: "Crime Map" },
  { href: "/stats", label: "Statistics" },
];

const USER_ITEMS = [
  { href: "/reports/new", label: "Report Crime" },
  { href: "/crimes", label: "Crime Reports" },
  { href: "/reports/map", label: "Crime Map" },
  { href: "/stats", label: "Statistics" },
  { href: "/dashboard", label: "Dashboard" },
];

const ADMIN_ITEMS = [
  { href: "/crimes", label: "Crime Reports" },
  { href: "/reports/map", label: "Crime Map" },
  { href: "/stats", label: "Statistics" },
  { href: "/admin/dashboard", label: "Admin Dashboard" },
];

export function MainNav({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = !user ? GUEST_ITEMS : user.role === "ADMIN" ? ADMIN_ITEMS : USER_ITEMS;
  const displayName = user ? user.name.trim() || user.email.split("@")[0] : "";

  async function handleLogout() {
    setSigningOut(true);
    const { error } = await authClient.signOut();
    setSigningOut(false);
    if (error) {
      toast.error("Could not log out. Please try again.");
      return;
    }
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
          : "bg-white border-b border-gray-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex h-20 items-center justify-between">
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center">
            <svg
              className="h-8 w-8 text-red-600 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">SafetyWatch</span>
          </Link>
        </div>

        {/* Center: Navigation links (visible only on screens 1200px and above) */}
        <nav className="hidden min-[1200px]:flex items-center">
          <ul className="flex space-x-8">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`relative py-2 px-1 text-lg font-semibold ${
                    pathname === item.href ? "text-red-600" : "text-gray-900 hover:text-red-500"
                  } transition-colors duration-200`}
                >
                  {item.label}
                  {pathname === item.href && (
                    <motion.div
                      layoutId="navUnderline"
                      className="absolute left-0 right-0 h-1 bg-red-600 bottom-0"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: Auth/User actions (visible on screens 1200px and above) */}
        <div className="hidden min-[1200px]:flex items-center">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-lg font-medium text-gray-900">{displayName}</span>
              <Button
                onClick={handleLogout}
                disabled={signingOut}
                variant="outline"
                className="h-10 px-5 text-lg font-semibold border-red-600 text-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Button
                asChild
                variant="ghost"
                className="h-10 px-5 text-lg font-semibold text-gray-900 hover:bg-gray-100"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button
                asChild
                className="h-10 px-5 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white"
              >
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu toggle button (visible below 1200px) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          className="min-[1200px]:hidden ml-4 p-2 rounded-md text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-600"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu (visible on screens below 1200px) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobileMenu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="min-[1200px]:hidden border-t border-gray-200 bg-white shadow-md rounded-b-lg"
          >
            <nav className="px-4 py-4">
              <ul className="flex flex-col space-y-3 divide-y divide-gray-200">
                {navItems.map((item) => (
                  <li key={item.href} className="pt-2">
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block py-2 text-lg font-semibold ${
                        pathname === item.href ? "text-red-600" : "text-gray-900 hover:text-red-500"
                      } transition-colors duration-200`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li className="pt-6">
                  {user ? (
                    <div className="flex flex-col space-y-2 pt-2">
                      <span className="text-lg font-medium text-gray-900">{displayName}</span>
                      <Button
                        onClick={handleLogout}
                        disabled={signingOut}
                        variant="outline"
                        className="h-10 w-full text-lg font-semibold border-red-600 text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="pt-2">
                        <Button
                          asChild
                          variant="ghost"
                          className="h-10 w-full text-lg font-semibold text-gray-900 hover:bg-gray-100"
                        >
                          <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                            Login
                          </Link>
                        </Button>
                      </div>
                      <div className="pt-2">
                        <Button
                          asChild
                          className="h-10 w-full text-lg font-semibold bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                            Register
                          </Link>
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
