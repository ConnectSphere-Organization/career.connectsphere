"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type ApiPayload = { message?: string; responseUrl?: string };

export function OfferActions({ id, status }: { id: string; status: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function action(path: string, body?: object) {
    setBusy(true);
    setMessage(null);
    const options: RequestInit = body
      ? {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }
      : { method: "POST" };
    const response = await fetch(
      `/api/recruitment/offers/${encodeURIComponent(id)}/${path}`,
      options,
    );
    const payload = (await response.json()) as ApiPayload;
    setBusy(false);
    if (!response.ok) return setMessage(payload.message ?? "Action failed");
    if (payload.responseUrl) {
      await navigator.clipboard.writeText(payload.responseUrl);
      return setMessage("New response link copied. Older links are invalid.");
    }
    setMessage(payload.message ?? "Completed");
    if (path === "status" || path === "extend") window.location.reload();
  }

  function extend() {
    const validUntil = window.prompt("New validity date (YYYY-MM-DD)");
    if (!validUntil) return;
    const notes = window.prompt("Reason for extension");
    if (!notes) return;
    void action("extend", { validUntil, notes });
  }

  function setStatus(nextStatus: "ACCEPTED" | "REJECTED") {
    const reason = window.prompt(
      `Reason for marking ${nextStatus.toLowerCase()}`,
    );
    if (reason) void action("status", { status: nextStatus, reason });
  }

  return (
    <div className="flex min-w-60 flex-wrap gap-2">
      {status === "PENDING" ? (
        <>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={extend}
          >
            Extend
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => action("token")}
          >
            New link
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => setStatus("ACCEPTED")}
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => setStatus("REJECTED")}
          >
            Reject
          </Button>
        </>
      ) : null}
      {message ? (
        <p role="status" className="w-full text-xs text-slate-600">
          {message}
        </p>
      ) : null}
    </div>
  );
}
