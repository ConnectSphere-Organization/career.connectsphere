import Link from "next/link";
import { notFound } from "next/navigation";

import {
  isDevelopmentMailboxEnabled,
  listDevelopmentEmails,
} from "@/lib/email/mailer";

export const dynamic = "force-dynamic";

export default function DevelopmentMailboxPage() {
  if (!isDevelopmentMailboxEnabled()) notFound();
  const emails = listDevelopmentEmails();
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <p className="section-kicker">Development only</p>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-950">
          Local email mailbox
        </h1>
        <p className="mt-3 text-slate-600">
          Verification and reset links appear here when external SMTP is
          unavailable. This route does not exist in production.
        </p>
        <div className="mt-8 space-y-4">
          {emails.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-slate-600">
              No local emails yet.
            </div>
          ) : (
            emails.map((email) => (
              <article
                key={email.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-bold tracking-wide text-emerald-700 uppercase">
                  {email.recipient}
                </p>
                <h2 className="mt-2 text-xl font-bold">{email.subject}</h2>
                <p className="mt-3 text-slate-600">{email.message}</p>
                <Link
                  href={email.actionUrl}
                  className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white"
                >
                  {email.actionLabel}
                </Link>
                <p className="mt-4 text-xs text-slate-400">{email.createdAt}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
