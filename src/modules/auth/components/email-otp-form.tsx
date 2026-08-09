"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";

const RESEND_COOLDOWN_SECONDS = 60;

function safeRedirect(value: string | null): string {
    return value?.startsWith("/") && !value.startsWith("//")
        ? value
        : "/my-applications";
}

export function EmailOTPForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email")?.trim().toLowerCase() ?? "";
    const [otp, setOtp] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = window.setInterval(
            () => setCooldown((current) => Math.max(0, current - 1)),
            1_000,
        );
        return () => window.clearInterval(timer);
    }, [cooldown]);

    if (!email) {
        return (
            <div className="space-y-4 text-sm">
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 font-medium text-rose-700">
                    Email address is missing. Create your account again.
                </p>
                <Link href="/register" className="font-semibold text-blue-700">
                    Return to registration
                </Link>
            </div>
        );
    }

    async function resendOTP() {
        setError(null);
        setMessage(null);
        setIsResending(true);
        const result = await authClient.emailOtp.sendVerificationOtp({
            email,
            type: "email-verification",
        });
        setIsResending(false);
        if (result.error) {
            setError(
                result.error.status === 429
                    ? "Too many requests. Wait a minute before requesting another code."
                    : result.error.message ?? "Unable to resend verification code.",
            );
            return;
        }
        setCooldown(RESEND_COOLDOWN_SECONDS);
        setMessage("A new verification code was sent. Check your inbox and spam folder.");
    }

    return (
        <form
            className="space-y-5"
            noValidate
            onSubmit={async (event) => {
                event.preventDefault();
                const normalizedOTP = otp.replace(/\D/g, "");
                if (normalizedOTP.length !== 6) {
                    setError("Enter the 6-digit verification code.");
                    return;
                }

                setError(null);
                setMessage(null);
                setIsVerifying(true);
                const result = await authClient.emailOtp.verifyEmail({
                    email,
                    otp: normalizedOTP,
                });
                setIsVerifying(false);
                if (result.error) {
                    setError(
                        result.error.code === "OTP_EXPIRED"
                            ? "This code has expired. Request a new code."
                            : "The verification code is incorrect. Try again.",
                    );
                    return;
                }

                router.replace(safeRedirect(searchParams.get("redirect")));
                router.refresh();
            }}
        >
            <p className="text-sm leading-6 text-slate-600">
                A 6-digit code was sent to <strong className="text-slate-900">{email}</strong>.
                It expires in 10 minutes.
            </p>
            {error ? (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {error}
                </p>
            ) : null}
            {message ? (
                <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {message}
                </p>
            ) : null}
            <div className="space-y-2">
                <Label htmlFor="email-otp">6-digit verification code</Label>
                <Input
                    id="email-otp"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    placeholder="000000"
                    className="text-center text-xl tracking-[0.35em]"
                    required
                />
            </div>
            <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                {isVerifying ? "Verifying…" : "Verify email"}
            </Button>
            <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={cooldown > 0 || isResending}
                onClick={() => void resendOTP()}
            >
                {isResending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                {isResending
                    ? "Sending…"
                    : cooldown > 0
                        ? `Resend code in ${cooldown}s`
                        : "Resend code"}
            </Button>
            <p className="text-center text-xs text-slate-500">
                Didn&apos;t receive it? Check spam, confirm the email address, then resend.
            </p>
        </form>
    );
}
