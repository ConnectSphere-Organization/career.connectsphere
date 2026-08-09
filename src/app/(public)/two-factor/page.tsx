import type { Metadata } from "next";
import { Suspense } from "react";

import { TwoFactorChallenge } from "@/modules/auth/components/two-factor-challenge";

export const metadata: Metadata = {
  title: "Two-factor authentication",
  robots: { index: false, follow: false },
};

export default function TwoFactorPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-xl border border-slate-200 bg-white p-6">
        <Suspense>
          <TwoFactorChallenge />
        </Suspense>
      </div>
    </main>
  );
}
