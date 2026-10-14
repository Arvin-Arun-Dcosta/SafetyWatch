import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";

/** The signed-in user, as far as the app is concerned. */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/**
 * Reads the session from the request cookies and loads the user from the
 * database, so a role change takes effect on the next request. Cached per
 * request: the layout, page and actions share one lookup.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, role } = session.user;
  return { id, name, email, role: role === "ADMIN" ? "ADMIN" : "USER" };
});

/** For pages: sends anonymous visitors to the login page. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages: only admins get through. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
