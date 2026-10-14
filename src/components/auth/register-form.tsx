"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { GoogleIcon } from "@/components/icons/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { signUpSchema } from "@/lib/validation";

type SignUpValues = z.infer<typeof signUpSchema>;

const FIELDS = [
  { name: "name", placeholder: "Full Name", type: "text", autoComplete: "name" },
  { name: "email", placeholder: "Email Address", type: "email", autoComplete: "email" },
  { name: "password", placeholder: "Password", type: "password", autoComplete: "new-password" },
  {
    name: "confirmPassword",
    placeholder: "Confirm Password",
    type: "password",
    autoComplete: "new-password",
  },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: SignUpValues) {
    setIsLoading(true);
    // Every new account is a regular user; the server ignores any role field.
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    setIsLoading(false);

    if (error) {
      toast.error(
        error.status === 429
          ? "Too many attempts. Please wait a moment and try again."
          : (error.message ?? "Registration failed."),
      );
      return;
    }

    toast.success("Registration successful!");
    router.push("/");
    router.refresh();
  }

  async function handleGoogleRegister() {
    setIsGoogleLoading(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
      errorCallbackURL: "/login",
    });
    if (error) {
      setIsGoogleLoading(false);
      toast.error("Google registration failed.");
    }
  }

  return (
    <>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-4">
          {FIELDS.map((field, index) => (
            <motion.div
              key={field.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <Input
                id={field.name}
                placeholder={field.placeholder}
                aria-label={field.placeholder}
                type={field.type}
                autoComplete={field.autoComplete}
                aria-invalid={errors[field.name] ? true : undefined}
                disabled={isLoading}
                {...register(field.name)}
              />
              {errors[field.name] && (
                <p className="mt-1 text-sm text-destructive">{errors[field.name]?.message}</p>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            type="submit"
            className="relative w-full group"
            disabled={isLoading || isGoogleLoading}
          >
            <span className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <span className="relative flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              {isLoading ? "Creating account..." : "Register"}
            </span>
          </Button>
        </motion.div>
      </form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="relative mt-6"
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white/90 dark:bg-gray-900/90 text-gray-500 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-1 gap-3 mt-6"
      >
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2"
          type="button"
          onClick={handleGoogleRegister}
          disabled={isLoading || isGoogleLoading}
        >
          <GoogleIcon className="w-4 h-4" />
          {isGoogleLoading ? "Redirecting..." : "Google"}
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400"
      >
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          Sign in
        </Link>
      </motion.p>
    </>
  );
}
