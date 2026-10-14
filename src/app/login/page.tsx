import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogIn } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Login" };

/** Messages for the error codes Better Auth appends after a failed Google sign-in. */
function noticeFor(error: string | undefined): string | undefined {
  if (!error) return undefined;
  if (error === "account_not_linked") {
    return "An account with this email already exists. Sign in with your password instead.";
  }
  return "Google sign-in did not complete. Please try again.";
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSessionUser()) redirect("/");

  const { error } = await searchParams;

  return (
    <AuthShell
      icon={<LogIn className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400" />}
      title="Welcome Back"
      titleClassName="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-400"
      subtitle="Sign in to your account"
    >
      <LoginForm notice={noticeFor(typeof error === "string" ? error : undefined)} />
    </AuthShell>
  );
}
