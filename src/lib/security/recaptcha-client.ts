"use client";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
    };
  }
}

export async function recaptchaToken(action: string): Promise<string> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return "";
  if (!window.grecaptcha) throw new Error("Bot verification is still loading");
  await new Promise<void>((resolve) => window.grecaptcha?.ready(resolve));
  return window.grecaptcha.execute(siteKey, { action });
}
