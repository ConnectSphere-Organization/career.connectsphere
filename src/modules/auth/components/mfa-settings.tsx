"use client";

import { LoaderCircle, ShieldCheck, ShieldOff } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";

export function MfaSettings({ enabled }: { enabled: boolean }) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function enable() {
    setBusy(true);
    setMessage(null);
    const result = await authClient.twoFactor.enable({
      password,
      issuer: "ConnectSphere Careers",
    });
    setBusy(false);
    if (result.error || !result.data)
      return setMessage(
        result.error?.message ?? "Unable to start MFA enrollment",
      );
    setQrCode(
      await QRCode.toDataURL(result.data.totpURI, { width: 280, margin: 1 }),
    );
    setBackupCodes(result.data.backupCodes);
  }
  async function verify() {
    setBusy(true);
    setMessage(null);
    const result = await authClient.twoFactor.verifyTotp({
      code: code.replace(/\s/g, ""),
      trustDevice: true,
    });
    setBusy(false);
    if (result.error) return setMessage(result.error.message ?? "Invalid code");
    setMessage("Multi-factor authentication is enabled.");
    window.location.reload();
  }
  async function disable() {
    setBusy(true);
    setMessage(null);
    const result = await authClient.twoFactor.disable({ password });
    setBusy(false);
    if (result.error)
      return setMessage(result.error.message ?? "Unable to disable MFA");
    setMessage("Multi-factor authentication is disabled.");
    window.location.reload();
  }
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 items-center justify-center rounded-lg ${enabled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
        >
          {enabled ? (
            <ShieldCheck aria-hidden="true" />
          ) : (
            <ShieldOff aria-hidden="true" />
          )}
        </span>
        <div>
          <h2 className="font-semibold text-slate-950">Authenticator app</h2>
          <p className="mt-1 text-sm text-slate-600">
            Status: {enabled ? "Enabled" : "Not enabled"}. Privileged production
            roles require MFA.
          </p>
        </div>
      </div>
      {message ? (
        <p
          role="status"
          className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
        >
          {message}
        </p>
      ) : null}
      <div className="max-w-md space-y-2">
        <Label htmlFor="mfa-password">Confirm your password</Label>
        <Input
          id="mfa-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {!enabled && !qrCode ? (
        <Button
          type="button"
          disabled={busy || !password}
          onClick={() => void enable()}
        >
          {busy ? <LoaderCircle className="animate-spin" /> : null}Start
          enrollment
        </Button>
      ) : null}
      {qrCode ? (
        <div className="space-y-4 rounded-lg border border-slate-200 p-5">
          <Image
            src={qrCode}
            width={280}
            height={280}
            alt="Authenticator enrollment QR code"
            unoptimized
          />
          <p className="text-sm text-slate-600">
            Scan the QR code, then enter the generated code to finish
            enrollment.
          </p>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="mfa-code">Verification code</Label>
            <Input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          <Button
            type="button"
            disabled={busy || code.length < 6}
            onClick={() => void verify()}
          >
            Verify and enable
          </Button>
          {backupCodes.length ? (
            <div>
              <h3 className="text-sm font-semibold">Backup codes</h3>
              <p className="mt-1 text-xs text-slate-500">
                Store these once in a secure password manager.
              </p>
              <ul className="mt-2 grid gap-1 font-mono text-sm sm:grid-cols-2">
                {backupCodes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      {enabled ? (
        <Button
          type="button"
          variant="destructive"
          disabled={busy || !password}
          onClick={() => void disable()}
        >
          Disable MFA
        </Button>
      ) : null}
    </div>
  );
}
