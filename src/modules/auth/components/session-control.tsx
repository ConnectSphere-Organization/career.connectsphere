"use client";

import { LoaderCircle, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";

export function SessionControl({
  compact = false,
  bottomNavigation = false,
}: {
  compact?: boolean;
  bottomNavigation?: boolean;
}) {
  const router = useRouter();
  const { data: session, isPending, refetch } = authClient.useSession();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const synchronize = () => void refetch();
    window.addEventListener("focus", synchronize);
    window.addEventListener("storage", synchronize);
    const interval = window.setInterval(synchronize, 60_000);

    return () => {
      window.removeEventListener("focus", synchronize);
      window.removeEventListener("storage", synchronize);
      window.clearInterval(interval);
    };
  }, [refetch]);

  if (mounted && isPending) {
    return (
      <span
        className={
          bottomNavigation
            ? "flex min-w-16 flex-col items-center justify-center px-2 py-2 text-xs text-slate-500"
            : "inline-flex h-10 items-center px-3 text-sm text-current/60"
        }
      >
        <LoaderCircle
          className="size-4 animate-spin"
          aria-label="Checking session"
        />
      </span>
    );
  }

  if (!mounted || !session) {
    return (
      <Link
        href="/login"
        className={
          bottomNavigation
            ? "flex min-w-16 flex-col items-center justify-center rounded-lg px-2 py-2 text-xs font-medium text-slate-500"
            : compact
              ? "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
              : buttonVariants()
        }
      >
        <LogIn className={bottomNavigation ? "size-5" : "size-4"} />
        Sign in
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant={compact || bottomNavigation ? "ghost" : "secondary"}
      className={
        bottomNavigation
          ? "flex h-auto min-w-16 flex-col gap-1 rounded-lg px-2 py-2 text-xs font-medium text-slate-500"
          : undefined
      }
      disabled={signingOut}
      onClick={async () => {
        setSigningOut(true);
        await authClient.signOut();
        localStorage.setItem(
          "connectsphere:session-changed",
          String(Date.now()),
        );
        router.replace("/login?message=Signed%20out");
        router.refresh();
      }}
    >
      <LogOut className={bottomNavigation ? "size-5" : "size-4"} />
      {signingOut ? "Signing out…" : "Sign out"}
    </Button>
  );
}
