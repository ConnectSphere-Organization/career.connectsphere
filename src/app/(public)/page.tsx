import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  Check,
  Code2,
  Headphones,
  Megaphone,
  MessageSquareText,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import { Reveal } from "@/components/shared/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeroSection } from "@/modules/home/components/hero-section";
import { ReviewCarousel } from "@/modules/home/components/review-carousel";
import { getApprovedReviews } from "@/modules/reviews/server/public-reviews";

export const metadata: Metadata = {
  title: "Build Better Business Conversations",
  description:
    "Join ConnectSphere and help build the communication platform businesses use to connect with their customers.",
  alternates: { canonical: "/" },
};

const teamAreas = [
  {
    icon: Code2,
    title: "Engineering",
    description:
      "Build dependable distributed systems, polished product experiences, and the infrastructure behind every conversation.",
  },
  {
    icon: Blocks,
    title: "Product & design",
    description:
      "Turn complex communication workflows into clear tools that teams can understand and trust.",
  },
  {
    icon: Headphones,
    title: "Customer success",
    description:
      "Help growing businesses get real value from ConnectSphere and bring their feedback directly into the product.",
  },
  {
    icon: Megaphone,
    title: "Growth & operations",
    description:
      "Shape how we reach customers, run the business, and scale the systems that support our teams.",
  },
];

const principles = [
  {
    title: "Stay close to the customer",
    description:
      "We start with the real work customers are trying to do and measure success by the progress we create for them.",
  },
  {
    title: "Own the outcome",
    description:
      "People have room to make decisions, ask hard questions, and carry important work from idea to impact.",
  },
  {
    title: "Make complexity usable",
    description:
      "The platform is sophisticated. The experience should still feel clear, calm, and dependable.",
  },
];

const hiringSteps = [
  {
    icon: Search,
    label: "Explore",
    description: "Find a role that matches the problems you want to solve.",
  },
  {
    icon: MessageSquareText,
    label: "Meet",
    description: "Talk with the team about your craft, context, and goals.",
  },
  {
    icon: Sparkles,
    label: "Decide",
    description:
      "Get a clear decision and next steps without a mystery process.",
  },
];

export default async function HomePage() {
  const reviews = await getApprovedReviews(10);

  return (
    <div className="overflow-hidden bg-white text-slate-950">
      <HeroSection />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-7 sm:grid-cols-3 lg:px-8">
          {[
            ["One platform", "Messaging, automation, campaigns, and commerce"],
            ["One team", "Product, engineering, operations, and growth"],
            ["One standard", "Reliable work that customers can depend on"],
          ].map(([title, description]) => (
            <div key={title} className="border-l-2 border-blue-600 pl-4">
              <p className="text-sm font-semibold text-slate-950">{title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="working-at-connectsphere"
        className="border-b border-slate-200 bg-[#fbfbfd] py-16 sm:py-20 lg:py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-8">
          <Reveal>
            <p className="section-kicker">The mission</p>
            <h2 className="section-title mt-5">
              Make every business conversation feel <span>connected.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="max-w-2xl text-lg leading-8 text-slate-600">
              <p>
                Businesses should not need a maze of disconnected tools to
                understand and serve their customers. ConnectSphere brings
                conversations, campaigns, automation, and commerce into one
                operating layer.
              </p>
              <p className="mt-5">
                That creates meaningful work across the stack: resilient
                infrastructure, thoughtful interfaces, trusted customer
                partnerships, and disciplined operations.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Problems with real operational depth",
                "Direct access to customer context",
                "Room to improve systems, not just tickets",
                "A team that values clear written thinking",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 border-t border-slate-200 pt-3 text-sm font-medium text-slate-700"
                >
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-blue-600"
                    aria-hidden="true"
                  />
                  {item}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-slate-200 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="section-kicker">Where you can contribute</p>
              <h2 className="section-title mt-5">Work across the platform.</h2>
            </div>
            <p className="max-w-lg text-base leading-7 text-slate-600">
              Different disciplines, one shared goal: make customer
              communication more useful, reliable, and human.
            </p>
          </Reveal>
          <div className="mt-12 grid border-y border-slate-200 md:grid-cols-2 lg:grid-cols-4">
            {teamAreas.map((area, index) => (
              <Reveal
                key={area.title}
                delay={index * 0.06}
                className="group border-b border-slate-200 p-6 transition-colors hover:bg-slate-50 md:odd:border-r lg:border-r lg:border-b-0 lg:last:border-r-0"
              >
                <area.icon
                  className="size-5 text-blue-600"
                  aria-hidden="true"
                />
                <h3 className="mt-8 text-lg font-semibold text-slate-950">
                  {area.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {area.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-950 py-16 text-white sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-8">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.16em] text-blue-300 uppercase">
              How we work
            </p>
            <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">
              Ambitious work, without unnecessary theatre.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">
              We value clear decisions, useful feedback, and steady delivery.
              Strong ideas can come from anywhere; ownership stays with the
              people closest to the work.
            </p>
          </Reveal>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {principles.map((principle, index) => (
              <Reveal
                key={principle.title}
                delay={index * 0.07}
                className="grid gap-3 py-6 sm:grid-cols-[3rem_1fr]"
              >
                <span className="font-mono text-sm text-blue-300">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-white">
                    {principle.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {principle.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#fbfbfd] py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <p className="section-kicker">Hiring at ConnectSphere</p>
            <h2 className="section-title mt-5">A direct, human process.</h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              We use interviews to understand how you think and to help you
              decide whether the team is right for you.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {hiringSteps.map((step, index) => (
              <Reveal key={step.label} delay={index * 0.08}>
                <div className="border-t-2 border-slate-950 pt-5">
                  <div className="flex items-center justify-between">
                    <step.icon
                      className="size-5 text-blue-600"
                      aria-hidden="true"
                    />
                    <span className="font-mono text-xs text-slate-400">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{step.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {reviews.length ? (
        <section className="border-b border-slate-200 py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Reveal className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="section-kicker">Employee voices</p>
                <h2 className="section-title mt-5">
                  From people doing the work.
                </h2>
              </div>
              <Users className="size-8 text-blue-600" aria-hidden="true" />
            </Reveal>
            <div className="mt-10">
              <ReviewCarousel reviews={reviews} />
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-blue-600 py-14 text-white sm:py-16">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold text-blue-100">
              Your next problem might be here.
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Find your place at ConnectSphere.
            </h2>
          </div>
          <Link
            href="/jobs"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "shrink-0 border-white bg-white text-slate-950 hover:border-white hover:bg-blue-50",
            )}
          >
            Explore open roles{" "}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
