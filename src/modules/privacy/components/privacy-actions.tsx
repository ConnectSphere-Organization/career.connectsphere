"use client";

import { Download, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PrivacyActions({
  deletionPending,
}: {
  deletionPending: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function requestDeletion() {
    if (
      !window.confirm(
        "Submit a request to delete or anonymize eligible candidate data? Records required by law or active employment may be retained.",
      )
    )
      return;
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/privacy", { method: "POST" });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    setBusy(false);
    setMessage(
      payload?.message ??
        (response.ok
          ? "Deletion request submitted"
          : "Unable to submit request"),
    );
    if (response.ok) window.location.reload();
  }
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <a href="/api/privacy/export">
          <Download />
          Download my data
        </a>
      </Button>
      <Button
        type="button"
        variant="destructive"
        disabled={busy || deletionPending}
        onClick={() => void requestDeletion()}
      >
        <Trash2 />
        {deletionPending ? "Deletion request pending" : "Request deletion"}
      </Button>
      {message ? (
        <p
          className="w-full text-sm font-semibold text-slate-700"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
