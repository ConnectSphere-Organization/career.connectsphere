"use client";

import { IdCard, Menu, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/brand-mark";
import {
  DesktopManagementNavigation,
  MobileManagementNavigation,
} from "@/components/layout/management-navigation";
import { publicNavigation } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { SessionControl } from "@/modules/auth/components/session-control";
import { useUiStore } from "@/stores/ui-store";

export function SiteHeader({
  employeeAccess = false,
  hrWorkspaceHref = null,
}: {
  employeeAccess?: boolean;
  hrWorkspaceHref?: string | null;
}) {
  const pathname = usePathname();
  const mobileMenuOpen = useUiStore((state) => state.mobileMenuOpen);
  const setMobileMenuOpen = useUiStore((state) => state.setMobileMenuOpen);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-20 lg:px-8">
          <Link
            href="/"
            className="rounded-lg"
            aria-label="ConnectSphere Careers home"
          >
            <BrandMark />
          </Link>

          <nav
            className="hidden items-center gap-2 md:flex"
            aria-label="Primary navigation"
          >
            {publicNavigation.map((item) => {
              const active = pathname === item.href;
              if (item.href === "/login")
                return <SessionControl key={item.href} />;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {employeeAccess ? (
              <Link
                href="/employee/profile"
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  pathname.startsWith("/employee/")
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-primary/10 hover:text-primary",
                )}
              >
                Employee portal
              </Link>
            ) : null}
            {hrWorkspaceHref ? (
              <Link
                href={hrWorkspaceHref}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  pathname.startsWith("/recruitment")
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-primary/10 hover:text-primary",
                )}
              >
                HR workspace
              </Link>
            ) : null}
            <DesktopManagementNavigation pathname={pathname} />
          </nav>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          >
            {mobileMenuOpen ? (
              <X aria-hidden="true" />
            ) : (
              <Menu aria-hidden="true" />
            )}
          </Button>
        </div>

        {mobileMenuOpen ? (
          <nav
            id="mobile-menu"
            className="border-t border-slate-100 bg-white px-4 py-3 md:hidden"
            aria-label="Mobile navigation"
          >
            {publicNavigation
              .filter((item) => item.href !== "/login")
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 font-semibold text-slate-700 hover:bg-primary/10 hover:text-primary"
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            {employeeAccess ? (
              <Link
                href="/employee/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 font-semibold text-slate-700 hover:bg-primary/10 hover:text-primary"
              >
                <IdCard className="size-5" aria-hidden="true" />
                Employee portal
              </Link>
            ) : null}
            {hrWorkspaceHref ? (
              <Link
                href={hrWorkspaceHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 font-semibold text-slate-700 hover:bg-primary/10 hover:text-primary"
              >
                <ShieldCheck className="size-5" aria-hidden="true" />
                HR workspace
              </Link>
            ) : null}
            <MobileManagementNavigation
              pathname={pathname}
              onNavigate={() => setMobileMenuOpen(false)}
            />
            <div className="px-3 py-2">
              <SessionControl />
            </div>
          </nav>
        ) : null}
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl md:hidden"
        aria-label="Bottom navigation"
      >
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
          {publicNavigation
            .filter(
              (item) => item.href !== "/login" && item.href !== "/privacy",
            )
            .map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-w-16 flex-col items-center justify-center rounded-xl px-2 py-2 text-xs font-medium",
                    active ? "bg-primary/10 text-primary" : "text-slate-500",
                  )}
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  <span className="mt-1">
                    {item.href === "/company" ? "Culture" : item.label}
                  </span>
                </Link>
              );
            })}
          {employeeAccess ? (
            <Link
              href="/employee/profile"
              className={cn(
                "flex min-w-16 flex-col items-center justify-center rounded-xl px-2 py-2 text-xs font-medium",
                pathname.startsWith("/employee/")
                  ? "bg-primary/10 text-primary"
                  : "text-slate-500",
              )}
            >
              <IdCard className="size-5" aria-hidden="true" />
              <span className="mt-1">Employee</span>
            </Link>
          ) : null}
          {hrWorkspaceHref ? (
            <Link
              href={hrWorkspaceHref}
              className={cn(
                "flex min-w-16 flex-col items-center justify-center rounded-xl px-2 py-2 text-xs font-medium",
                pathname.startsWith("/recruitment")
                  ? "bg-primary/10 text-primary"
                  : "text-slate-500",
              )}
            >
              <ShieldCheck className="size-5" aria-hidden="true" />
              <span className="mt-1">HR</span>
            </Link>
          ) : null}
          <SessionControl bottomNavigation />
        </div>
      </nav>
    </>
  );
}
