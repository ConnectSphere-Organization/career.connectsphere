import { ArrowUpRight, Mail } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";

const year = new Date().getFullYear();

const careerLinks = [
  ["Open roles", "/jobs"],
  ["Life at ConnectSphere", "/company"],
  ["My applications", "/my-applications"],
  ["Contact the team", "/contact"],
] as const;

const trustLinks = [
  ["Privacy", "/privacy"],
  ["Security", "/security"],
  ["Verify certificate", "/verify"],
  ["Verify offer", "/verify-offer"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.7fr_0.7fr]">
          <div className="max-w-md">
            <Link
              href="/"
              className="inline-flex rounded-lg"
              aria-label="ConnectSphere Careers home"
            >
              <BrandMark inverse />
            </Link>
            <p className="mt-6 text-sm leading-7 text-slate-400">
              Build the platform that helps businesses manage customer
              conversations, campaigns, automation, and commerce from one
              connected place.
            </p>
            <Link
              href="/jobs"
              className="mt-7 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-blue-400 hover:bg-white/5"
            >
              Explore roles{" "}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <FooterLinks title="Careers" links={careerLinks} />
          <FooterLinks title="Trust" links={trustLinks} />
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} ConnectSphere. All rights reserved.</p>
          <a
            href="mailto:careers@connectsphere.in"
            className="inline-flex items-center gap-2 hover:text-blue-300"
          >
            <Mail className="size-3.5" aria-hidden="true" />
            careers@connectsphere.in
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold tracking-[0.14em] text-slate-300 uppercase">
        {title}
      </h2>
      <nav className="mt-5 grid gap-3" aria-label={`${title} links`}>
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="w-fit text-sm text-slate-400 transition-colors hover:text-white"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
