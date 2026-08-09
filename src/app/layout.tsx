import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";

import { QueryProvider } from "@/components/providers/query-provider";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3001"),
  title: {
    default: "ConnectSphere Careers",
    template: "%s | ConnectSphere Careers",
  },
  description:
    "Build the communication platform businesses use to connect with their customers.",
  applicationName: "ConnectSphere Careers",
  category: "careers",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "ConnectSphere Careers",
    title: "ConnectSphere Careers",
    description:
      "Build the communication platform businesses use to connect with their customers.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "ConnectSphere Careers",
    description:
      "Build the communication platform businesses use to connect with their customers.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <QueryProvider>{children}</QueryProvider>
        {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY)}`}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
