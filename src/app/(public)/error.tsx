"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="flex min-h-[65vh] items-center justify-center bg-slate-50 px-6 py-20">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-bold text-slate-950">
          This page could not be loaded
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Try again. If the problem continues, return later.
        </p>
        <Button className="mt-7" onClick={reset}>
          <RotateCcw aria-hidden="true" /> Try again
        </Button>
      </div>
    </section>
  );
}
