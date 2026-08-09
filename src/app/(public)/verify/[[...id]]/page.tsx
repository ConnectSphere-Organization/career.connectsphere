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
    <div className="bg-slate-50 px-6 py-16 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <p className="section-kicker">Credential verification</p>
          <h1 className="mt-4 text-4xl font-extrabold text-slate-950">
            Verify a certificate
          </h1>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
            Confirm that a certificate was issued by ConnectSphere using its unique
            identifier.
          </p>
        </header>
        <VerificationForm kind="certificate" initialId={id?.[0] ?? ""} />
      </div>
    </div>
  );
}
