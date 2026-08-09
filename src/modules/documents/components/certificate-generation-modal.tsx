"use client";

import { Award, Layers3, UserRound, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BulkCertificateImport } from "@/modules/documents/components/bulk-certificate-import";
import { CertificateForm } from "@/modules/documents/components/certificate-form";
import type { CertificateInput } from "@/modules/documents/schema";

type Mode = "individual" | "bulk" | null;

export function CertificateGenerationModal({
  initialValues = {},
  jobs = [],
  fullWidth = false,
}: {
  initialValues?: Partial<CertificateInput>;
  jobs?: Array<{ id: string; title: string; company: string }>;
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
        <Award className="size-4" />
        Generate certificate
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
            className="my-6 w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="certificate-generation-title"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-xs font-bold tracking-widest text-emerald-700 uppercase">
                  Certificate workflow
                </p>
                <h2
                  id="certificate-generation-title"
                  className="mt-1 text-2xl font-extrabold"
                >
                  {mode === "individual"
                    ? "Individual certificate"
                    : mode === "bulk"
                      ? "Bulk certificate import"
                      : "Generate certificate"}
                </h2>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Close certificate dialog"
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
                    title="Individual certificate"
                    description="Issue one verification-safe certificate with recipient and duration details."
                    onClick={() => setMode("individual")}
                  />
                  <ChoiceCard
                    icon={Layers3}
                    title="Bulk certificates"
                    description="Upload a CSV to issue multiple certificates with row-level validation."
                    onClick={() => setMode("bulk")}
                  />
                </div>
              ) : null}
              {mode === "individual" ? (
                <CertificateForm initialValues={initialValues} jobs={jobs} />
              ) : null}
              {mode === "bulk" ? <BulkCertificateImport /> : null}
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
