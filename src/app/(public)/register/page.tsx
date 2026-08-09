import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard } from "@/modules/auth/components/auth-card";
import { RegisterForm } from "@/modules/auth/components/register-form";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const redirect = (await searchParams).redirect;
  const loginHref =
    redirect?.startsWith("/") && !redirect.startsWith("//")
      ? `/login?redirect=${encodeURIComponent(redirect)}`
      : "/login";
  return (
    <AuthCard
      kicker="Join ConnectSphere"
      title="Create an account"
      description={
        <>
          Or{" "}
          <Link href={loginHref} className="font-semibold text-blue-700">
            sign in to your existing account
          </Link>
        </>
      }
    >
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        }
      >
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}
