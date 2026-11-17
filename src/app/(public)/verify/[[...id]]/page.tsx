import type { Metadata } from "next";

import { VerificationForm } from "@/modules/verification/components/verification-form";

export const metadata: Metadata = { title: "Verify certificate" };

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ id?: string[] }>;
}) {
  const { id } = await params;
  return (
    <div className="relative overflow-hidden border-b border-slate-200 bg-[#f7f8fc] px-6 py-16 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_85%)] bg-[size:48px_48px]" />
      <div className="relative mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold tracking-[0.14em] text-emerald-800 uppercase">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            Credential verification
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            Verify a certificate
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600">
            Confirm that a certificate was issued by ConnectSphere using its unique
            identifier.
          </p>
        </header>
        <VerificationForm kind="certificate" initialId={id?.[0] ?? ""} />
      </div>
    </div>
  );
}
