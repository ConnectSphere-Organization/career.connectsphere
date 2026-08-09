import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-xl text-center">
        <p className="text-sm font-bold tracking-[0.25em] text-emerald-400 uppercase">
          404 · Route not found
        </p>
        <h1 className="mt-6 text-5xl font-extrabold tracking-tight sm:text-7xl">
          This path leads nowhere.
        </h1>
        <p className="mx-auto mt-6 max-w-md leading-7 text-slate-300">
          The opportunity may have moved or the address may be incomplete.
          Return home or explore current openings.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            <ArrowLeft />
            Home
          </Link>
          <Link href="/jobs" className={buttonVariants({ size: "lg" })}>
            <Search />
            Browse jobs
          </Link>
        </div>
      </div>
    </main>
  );
}
