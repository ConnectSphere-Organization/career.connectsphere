import {
  ArrowRight,
  CheckCircle2,
  MessageSquareText,
  Network,
  Workflow,
} from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const platformAreas = [
  { label: "Customer conversations", icon: MessageSquareText },
  { label: "Connected channels", icon: Network },
  { label: "Reliable automation", icon: Workflow },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#f7f8fc]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_85%)] bg-[size:48px_48px]" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-16 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold tracking-[0.14em] text-blue-700 uppercase">
            <span className="size-1.5 rounded-full bg-blue-600" />
            ConnectSphere careers
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl leading-[1.05] font-semibold tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-[4.3rem]">
            Build the systems that keep businesses in conversation.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Join the team building reliable customer communication across
            messaging, automation, campaigns, and commerce—all in one connected
            platform.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/jobs"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-blue-600 shadow-none hover:bg-blue-700",
              )}
            >
              View open roles{" "}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="#working-at-connectsphere"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              How we work
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
            {["Remote-friendly", "High ownership", "Customer-led"].map(
              (item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2
                    className="size-4 text-blue-600"
                    aria-hidden="true"
                  />
                  {item}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:mx-0">
          <div className="absolute -inset-8 rounded-full bg-blue-200/35 blur-3xl" />
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.7)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex size-7 items-center justify-center rounded-md bg-blue-500 text-[11px] font-black">
                  CS
                </span>
                The work behind the conversation
              </div>
              <span className="flex items-center gap-2 text-xs text-slate-400">
                <span className="size-1.5 rounded-full bg-emerald-400" /> Live
              </span>
            </div>
            <div className="grid gap-3 p-5 sm:p-6">
              {platformAreas.map((area, index) => (
                <div
                  key={area.label}
                  className="group flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.07]"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-blue-500/15 text-blue-300">
                    <area.icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
                      0{index + 1}
                    </p>
                    <p className="mt-0.5 font-medium text-slate-100">
                      {area.label}
                    </p>
                  </div>
                  <span className="h-px w-8 bg-blue-400/40 transition-all group-hover:w-12" />
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 bg-white/[0.025] px-5 py-4 text-sm leading-6 text-slate-400 sm:px-6">
              Product, engineering, operations, and go-to-market teams work as
              one system.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
