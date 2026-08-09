"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="rounded-lg border border-rose-200 bg-rose-50 p-6"
      role="alert"
    >
      <h1 className="text-lg font-semibold text-rose-950">
        Administration data could not be loaded
      </h1>
      <p className="mt-2 text-sm text-rose-800">
        The request failed without being converted into an empty result. Retry,
        then check service health if it continues.
      </p>
      <Button className="mt-5" type="button" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
