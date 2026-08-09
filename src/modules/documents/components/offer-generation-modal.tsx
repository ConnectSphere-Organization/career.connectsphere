"use client";

import { FileSignature, Layers3, UserRound, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BulkOfferImport } from "@/modules/documents/components/bulk-offer-import";
import { OfferForm } from "@/modules/documents/components/offer-form";
import type { OfferInput } from "@/modules/documents/schema";

type Mode = "individual" | "bulk" | null;

export function OfferGenerationModal({
  applicationId = "",
  initialValues = {},
  fullWidth = false,
}: {
  applicationId?: string;
  initialValues?: Partial<OfferInput>;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const close = () => {
    setOpen(false);
    setMode(null);
  };

  return (
    <>
      <Button
        type="button"
        className={fullWidth ? "w-full" : undefined}
        onClick={() => setOpen(true)}
      >
        <FileSignature className="size-4" />
        Generate offer letter
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            className="my-6 w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-generation-title"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-xs font-bold tracking-widest text-emerald-700 uppercase">
                  Offer workflow
                </p>
                <h2
                  id="offer-generation-title"
                  className="mt-1 text-2xl font-extrabold"
                >
                  {mode === "individual"
                    ? "Individual offer"
                    : mode === "bulk"
                      ? "Bulk offer import"
                      : "Generate offer letter"}
                </h2>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Close offer dialog"
                onClick={close}
              >
                <X />
              </Button>
            </header>
            <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-6">
              {!mode ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <ChoiceCard
                    icon={UserRound}
                    title="Individual offer"
                    description="Create one tailored offer with candidate, role, compensation, and onboarding details."
                    onClick={() => setMode("individual")}
                  />
                  <ChoiceCard
                    icon={Layers3}
                    title="Bulk offers"
                    description="Upload a validated CSV and issue multiple offers with row-by-row results."
                    onClick={() => setMode("bulk")}
                  />
                </div>
              ) : null}
              {mode === "individual" ? (
                <OfferForm
                  applicationId={applicationId}
                  initialValues={initialValues}
                />
              ) : null}
              {mode === "bulk" ? <BulkOfferImport /> : null}
              {mode ? (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setMode(null)}
                  >
                    Back to choice
                  </Button>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function ChoiceCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-3xl border border-slate-200 bg-slate-50 p-7 text-left transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-xl"
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white transition group-hover:bg-emerald-700">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-6 text-xl font-extrabold text-slate-950">{title}</h3>
      <p className="mt-2 leading-7 text-slate-600">{description}</p>
      <span className="mt-5 inline-block text-sm font-bold text-emerald-700">
        Choose workflow →
      </span>
    </button>
  );
}
