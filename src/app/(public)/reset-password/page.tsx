import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/modules/auth/components/auth-card";
import { ResetPasswordForm } from "@/modules/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <AuthCard
      kicker="Account recovery"
      title="Choose a new password"
      description="Use a strong password you do not reuse elsewhere."
    >
      <Suspense
        fallback={
          <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
