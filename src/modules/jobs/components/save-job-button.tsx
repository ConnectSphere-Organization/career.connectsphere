"use client";

import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function SaveJobButton({ jobId }: { jobId: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void fetch("/api/me/saved-jobs")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { savedJobs?: Array<{ jobId: string }> } | null) =>
        setSaved(
          payload?.savedJobs?.some((item) => item.jobId === jobId) ?? false,
        ),
      );
  }, [jobId]);
  async function toggle() {
    setBusy(true);
    const response = await fetch(`/api/me/saved-jobs/${jobId}`, {
      method: saved ? "DELETE" : "PUT",
    });
    setBusy(false);
    if (response.ok) setSaved((value) => !value);
  }
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={busy}
      aria-pressed={saved}
      onClick={() => void toggle()}
    >
      <Bookmark className={saved ? "fill-current" : ""} aria-hidden="true" />
      {saved ? "Saved" : "Save job"}
    </Button>
  );
}
