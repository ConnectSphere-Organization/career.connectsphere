import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/modules/auth/components/auth-card";
import { ForgotPasswordForm } from "@/modules/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      kicker="Account recovery"
      title="Reset password"
      description="Enter your email to receive a secure password-reset link."
      footer={
        <>
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-blue-700">
            Sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
