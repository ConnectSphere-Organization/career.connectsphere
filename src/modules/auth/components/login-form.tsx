"use client";

import { useForm } from "@tanstack/react-form";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { authErrorMessage } from "@/lib/auth/auth-error-message";
import { GoogleSignInButton } from "@/modules/auth/components/google-sign-in-button";
import { loginSchema } from "@/modules/auth/schemas";

function safeRedirect(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(
    searchParams.get("error")
      ? authErrorMessage(searchParams.get("error"))
      : searchParams.get("message"),
  );
  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    null,
  );
  const [verificationSent, setVerificationSent] = useState(false);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      setVerificationEmail(null);
      setVerificationSent(false);
      const parsed = loginSchema.safeParse(value);
      if (!parsed.success) {
        setServerError(
          parsed.error.issues[0]?.message ?? "Check your details and try again",
        );
        return;
      }

      const result = await authClient.signIn.email(parsed.data);
      if (result.error) {
        if (
          result.error.status === 403 ||
          result.error.code === "EMAIL_NOT_VERIFIED"
        ) {
          setVerificationEmail(parsed.data.email);
          setServerError("Verify your email address before signing in.");
          return;
        }
        setServerError(
          authErrorMessage(result.error.code ?? "INVALID_EMAIL_OR_PASSWORD"),
        );
        return;
      }

      const role = (result.data?.user.role ?? "USER").toUpperCase();
      router.replace(
        ["ADMIN", "SUPER_ADMIN", "RECRUITER", "MANAGER", "HR"].includes(role)
          ? "/recruitment"
          : ["FINANCE", "PAYROLL_ADMIN", "VERIFIER"].includes(role)
            ? "/admin/operations"
            : safeRedirect(searchParams.get("redirect")),
      );
      router.refresh();
    },
  });

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
      noValidate
    >
      {serverError ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
        >
          <p>{serverError}</p>
          {verificationEmail ? (
            <button
              type="button"
              className="mt-2 font-bold underline"
              onClick={async () => {
                const readiness = await fetch("/api/auth/email-readiness", {
                  cache: "no-store",
                });
                const readinessBody = (await readiness
                  .json()
                  .catch(() => null)) as {
                    ready?: boolean;
                    message?: string;
                  } | null;
                if (!readiness.ok || readinessBody?.ready !== true) {
                  setServerError(
                    readinessBody?.message ??
                    "Email delivery is temporarily unavailable. Please contact support.",
                  );
                  return;
                }
                const response = await authClient.sendVerificationEmail({
                  email: verificationEmail,
                  callbackURL: "/",
                });
                if (response.error) {
                  setServerError(
                    response.error.message ??
                    "Unable to send verification email",
                  );
                  return;
                }
                setVerificationSent(true);
              }}
            >
              {verificationSent
                ? "Verification email sent"
                : "Resend verification email"}
            </button>
          ) : null}
        </div>
      ) : null}
      <form.Field name="email">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Email address</Label>
            <Input
              id={field.name}
              name={field.name}
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              required
            />
          </div>
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor={field.name}>Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                Forgot your password?
              </Link>
            </div>
            <Input
              id={field.name}
              name={field.name}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              required
            />
          </div>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => [state.isSubmitting]}>
        {([isSubmitting]) => (
          <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />{" "}
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        )}
      </form.Subscribe>
      <GoogleSignInButton
        source="login"
        onError={(message) => setServerError(message || null)}
      />
    </form>
  );
}
