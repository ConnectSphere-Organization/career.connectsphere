"use client";

import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  inferAdditionalFields,
  twoFactorClient,
} from "better-auth/client/plugins";

import type { auth } from "@/lib/auth/auth";

export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    twoFactorClient({ twoFactorPage: "/two-factor" }),
    inferAdditionalFields<typeof auth>(),
  ],
});
