"use client";

import { ChevronDown, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { superAdminNavigation } from "@/config/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";

function useHydrated() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

function isSuperAdmin(role: string | null | undefined) {
  return (
    role?.trim().toUpperCase() === "SUPER_ADMIN" ||
    role?.trim().toLowerCase() === "super-admin"
  );
}

export function DesktopManagementNavigation({
  pathname,
}: {
  pathname: string;
}) {
  const hydrated = useHydrated();
  const { data: session } = authClient.useSession();
  if (!hydrated || !isSuperAdmin(session?.user.role)) return null;

  const active = superAdminNavigation.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return (
    <details className="group relative">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors marker:hidden",
          active
            ? "bg-primary/10 text-primary"
            : "text-slate-600 hover:bg-primary/10 hover:text-primary",
        )}
      >
        <ShieldCheck className="size-4" aria-hidden="true" />
        Manage
        <ChevronDown
          className="size-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="absolute right-0 mt-2 grid max-h-[70vh] w-96 grid-cols-2 gap-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
        {superAdminNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-primary/10 hover:text-primary",
              pathname === item.href && "bg-primary/10 text-primary",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

export function MobileManagementNavigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate: () => void;
}) {
  const hydrated = useHydrated();
  const { data: session } = authClient.useSession();
  if (!hydrated || !isSuperAdmin(session?.user.role)) return null;

  return (
    <div className="mt-2 border-t border-slate-100 pt-2">
      <p className="px-3 py-2 text-xs font-bold tracking-wider text-primary uppercase">
        Super-admin management
      </p>
      <div className="grid gap-1 sm:grid-cols-2">
        {superAdminNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-slate-700 hover:bg-primary/10 hover:text-primary",
              pathname === item.href && "bg-primary/10 text-primary",
            )}
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
