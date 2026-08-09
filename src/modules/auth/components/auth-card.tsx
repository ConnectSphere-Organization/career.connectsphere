import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/layout/brand-mark";

export function AuthCard({
  kicker,
  title,
  description,
  children,
  footer,
}: {
  kicker: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="flex min-h-[calc(100vh-9rem)] items-center justify-center border-y border-slate-200 bg-[#f7f8fc] px-4 py-14 sm:px-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 sm:p-9">
        <div className="mb-8 flex justify-center border-b border-slate-100 pb-6">
          <BrandMark />
        </div>
        <div className="text-center">
          <span className="section-kicker">{kicker}</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            {title}
          </h1>
          <div className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </div>
        </div>
        <div className="mt-8">{children}</div>
        {footer ? (
          <div className="mt-7 text-center text-sm text-slate-600">
            {footer}
          </div>
        ) : null}
        <p className="mt-7 text-center text-xs leading-5 text-slate-400">
          Return to{" "}
          <Link
            href="/"
            className="font-semibold text-blue-700 hover:text-blue-800"
          >
            ConnectSphere Careers
          </Link>
        </p>
      </div>
    </section>
  );
}
