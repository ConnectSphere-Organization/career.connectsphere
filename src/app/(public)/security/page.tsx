import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/authorization";
import { MfaSettings } from "@/modules/auth/components/mfa-settings";

export const metadata: Metadata = {
  title: "Account security",
  robots: { index: false, follow: false },
};

export default async function SecurityPage() {
  const session = await requireUser();
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="border-b border-slate-200 pb-6">
        <p className="section-kicker">Account security</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Multi-factor authentication
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Protect {session.user.email} with a time-based one-time password and
          recovery codes.
        </p>
      </header>
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <MfaSettings enabled={Boolean(session.user.twoFactorEnabled)} />
      </section>
    </main>
  );
}
