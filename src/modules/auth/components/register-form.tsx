"use client";

import { useForm } from "@tanstack/react-form";
import { LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { authErrorMessage } from "@/lib/auth/auth-error-message";
import { GoogleSignInButton } from "@/modules/auth/components/google-sign-in-button";
import { registrationSchema } from "@/modules/auth/schemas";

const fields = [
  {
    name: "name",
    label: "Full name",
    type: "text",
    autoComplete: "name",
    placeholder: "John Doe",
  },
  {
    name: "email",
    label: "Email address",
    type: "email",
    autoComplete: "email",
    placeholder: "your@email.com",
  },
  {
    name: "phoneNumber",
    label: "Phone number",
    type: "tel",
    autoComplete: "tel",
    placeholder: "1234567890",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    placeholder: "At least 6 characters",
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
    type: "password",
    autoComplete: "new-password",
    placeholder: "Repeat your password",
  },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(
    searchParams.get("error")
      ? authErrorMessage(searchParams.get("error"))
      : null,
  );
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const parsed = registrationSchema.safeParse(value);
      if (!parsed.success) {
        setServerError(
          parsed.error.issues[0]?.message ?? "Check your details and try again",
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
        setServerError(
          readinessBody?.message ??
          "Account registration is temporarily unavailable because verification email cannot be delivered.",
        );
        return;
      }

      const result = await authClient.signUp.email({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        phoneNumber: parsed.data.phoneNumber,
      });
      if (result.error) {
        setServerError(result.error.message ?? "Account creation failed");
        return;
      }

      const redirect = searchParams.get("redirect");
      const verificationParams = new URLSearchParams({
        email: parsed.data.email,
      });
      if (redirect?.startsWith("/") && !redirect.startsWith("//")) {
        verificationParams.set("redirect", redirect);
      }
      router.replace(
        `/verify-email?${verificationParams.toString()}`,
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
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
        >
          {serverError}
        </p>
      ) : null}
      {fields.map((item) => (
        <form.Field key={item.name} name={item.name}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>{item.label}</Label>
              <Input
                id={field.name}
                name={field.name}
                type={item.type}
                autoComplete={item.autoComplete}
                placeholder={item.placeholder}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                required
              />
            </div>
          )}
        </form.Field>
      ))}
      <form.Subscribe selector={(state) => [state.isSubmitting]}>
        {([isSubmitting]) => (
          <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />{" "}
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        )}
      </form.Subscribe>
      <GoogleSignInButton
        source="register"
        onError={(message) => setServerError(message || null)}
      />
      <p className="text-center text-xs leading-5 text-slate-500">
        By registering, you agree to ConnectSphere&apos;s{" "}
        <a
          href="https://connectsphere.vercel.app/TermsAndConditions"
          className="font-semibold text-blue-700"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="https://connectsphere.vercel.app/privacypolicy"
          className="font-semibold text-blue-700"
        >
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
