import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/modules/auth/components/auth-card";
import { EmailOTPForm } from "@/modules/auth/components/email-otp-form";

export const metadata: Metadata = { title: "Verify your email" };

export default function VerifyEmailPage() {
    return (
        <AuthCard
            kicker="One last step"
            title="Verify your email"
            description="Enter the verification code to activate your career account."
        >
            <Suspense
                fallback={
                    <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
                }
            >
                <EmailOTPForm />
            </Suspense>
        </AuthCard>
    );
}
