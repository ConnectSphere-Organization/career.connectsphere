import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard } from "@/modules/auth/components/auth-card";
import { LoginForm } from "@/modules/auth/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const redirect = (await searchParams).redirect;
  const registerHref =
    redirect?.startsWith("/") && !redirect.startsWith("//")
      ? `/register?redirect=${encodeURIComponent(redirect)}`
      : "/register";
  return (
    <AuthCard
      kicker="Welcome back"
      title="Sign in to your account"
      description={
        <>
          Or{" "}
          <Link href={registerHref} className="font-semibold text-blue-700">
            create a new account
          </Link>
        </>
      }
    >
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        }
      >
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
