"use client";

import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";

export function TwoFactorChallenge() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function verify() {
    setBusy(true);
    setError(null);
    const result = await authClient.twoFactor.verifyTotp({
      code: code.replace(/\s/g, ""),
      trustDevice,
    });
    setBusy(false);
    if (result.error)
      return setError(result.error.message ?? "Invalid authentication code");
    const redirect = searchParams.get("redirect");
    router.replace(
      redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : "/",
    );
    router.refresh();
  }
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void verify();
      }}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <ShieldCheck aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-slate-950">
            Two-factor authentication
          </h1>
          <p className="text-sm text-slate-600">
            Enter the six-digit code from your authenticator app.
          </p>
        </div>
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          {error}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="totp-code">Authentication code</Label>
        <Input
          id="totp-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={8}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          autoFocus
          required
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={trustDevice}
          onChange={(event) => setTrustDevice(event.target.checked)}
        />
        Trust this device for 30 days
      </label>
      <Button
        className="w-full"
        type="submit"
        disabled={busy || code.replace(/\s/g, "").length < 6}
      >
        {busy ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : null}
        Verify
      </Button>
    </form>
  );
}
