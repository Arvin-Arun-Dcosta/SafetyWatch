import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage() {
  if (await getSessionUser()) redirect("/");

  return (
    <AuthShell
      icon={<UserPlus className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400" />}
      title="Create your account"
      titleClassName="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400"
      subtitle="Join our community today"
    >
      <RegisterForm />
    </AuthShell>
  );
}
