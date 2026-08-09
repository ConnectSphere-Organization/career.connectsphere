"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CandidateOfferActions({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "ACCEPTED" | "REJECTED") {
    if (
      decision === "REJECTED" &&
      !window.confirm("Reject this offer? This decision cannot be undone.")
    )
      return;
    setBusy(decision);
    setError(null);
    const response = await fetch(
      `/api/my-applications/offers/${offerId}/decision`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, comments: "" }),
      },
    );
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      contractOnboarding?: string | null;
    } | null;
    setBusy(null);
    if (!response.ok) {
      setError(payload?.message ?? "Unable to record offer response");
      return;
    }
    if (payload?.contractOnboarding) {
      router.push(payload.contractOnboarding);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={busy !== null}
          onClick={() => void decide("ACCEPTED")}
        >
          {busy === "ACCEPTED" ? (
            <LoaderCircle className="animate-spin" />
          ) : null}
          Accept offer
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={busy !== null}
          onClick={() => void decide("REJECTED")}
        >
          {busy === "REJECTED" ? (
            <LoaderCircle className="animate-spin" />
          ) : null}
          Reject offer
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-sm font-semibold text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
