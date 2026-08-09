"use client";

import { useForm } from "@tanstack/react-form";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { loginSchema } from "@/modules/auth/schemas";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      setError(null);
      const parsed = loginSchema.shape.email.safeParse(value.email);
      if (!parsed.success) {
        setError(
          parsed.error.issues[0]?.message ?? "Enter a valid email address",
        );
        return;
      }
      const readiness = await fetch("/api/auth/email-readiness", {
        cache: "no-store",
      });
      const readinessBody = (await readiness.json().catch(() => null)) as {
        ready?: boolean;
        message?: string;
      } | null;
      if (!readiness.ok || readinessBody?.ready !== true) {
        setError(
          readinessBody?.message ??
            "Email delivery is temporarily unavailable. Please contact support.",
        );
        return;
      }
      const result = await authClient.requestPasswordReset({
        email: parsed.data,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (result.error) {
        setError(result.error.message ?? "Unable to request a reset link");
        return;
      }
      setSent(true);
    },
  });

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2
          className="mx-auto size-10 text-emerald-700"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-lg font-bold text-emerald-950">
          Check your email
        </h2>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          If an account exists for that address, a secure password-reset link
          has been sent.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      noValidate
    >
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      ) : null}
      <form.Field name="email">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Email address</Label>
            <Input
              id={field.name}
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              required
            />
          </div>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => [state.isSubmitting]}>
        {([isSubmitting]) => (
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />{" "}
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
