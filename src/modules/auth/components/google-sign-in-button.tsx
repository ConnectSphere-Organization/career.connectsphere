"use client";

import { LoaderCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import {
  googleOAuthCallbackURL,
  googleOAuthErrorCallbackURL,
  googleOAuthNewUserCallbackURL,
} from "@/lib/auth/google-oauth-redirect";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.4l-3.24-2.52c-.9.6-2.05.95-3.38.95-2.6 0-4.8-1.75-5.59-4.11H3.06v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.92A6 6 0 0 1 6.1 12c0-.67.12-1.32.31-1.92v-2.6H3.06A10 10 0 0 0 2 12c0 1.61.39 3.13 1.06 4.52l3.35-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.97c1.47 0 2.8.5 3.84 1.5l2.88-2.88C16.96 2.95 14.7 2 12 2a10 10 0 0 0-8.94 5.48l3.35 2.6C7.2 7.72 9.4 5.97 12 5.97Z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  onError,
  source,
}: {
  onError: (message: string) => void;
  source: "login" | "register";
}) {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        Or
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="flex justify-center">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-11 border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50"
          aria-label="Continue with Google"
          title="Continue with Google"
          disabled={isSubmitting}
          onClick={async () => {
            onError("");
            setIsSubmitting(true);
            const result = await authClient.signIn.social({
              provider: "google",
              callbackURL: googleOAuthCallbackURL(
                searchParams.get("redirect"),
              ),
              errorCallbackURL: googleOAuthErrorCallbackURL(
                source,
                searchParams.get("redirect"),
              ),
              newUserCallbackURL: googleOAuthNewUserCallbackURL(),
              requestSignUp: true,
            });
            if (result?.error) {
              setIsSubmitting(false);
              onError(result.error.message ?? "Unable to continue with Google");
            }
          }}
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <GoogleMark />
          )}
        </Button>
      </div>
    </>
  );
}
