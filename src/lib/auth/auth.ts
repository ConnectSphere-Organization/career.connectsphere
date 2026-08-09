import "server-only";

import { compare, hash } from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, twoFactor } from "better-auth/plugins";

import { env } from "@/config/env";
import { prisma } from "@/lib/db/prisma";
import { sendAccountEmail, sendAccountOTP } from "@/lib/email/mailer";
import { developmentTrustedOrigins } from "@/lib/http/origin-policy";

export const auth = betterAuth({
  appName: "ConnectSphere Careers",
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins:
    env.NODE_ENV === "production"
      ? [env.APP_URL]
      : developmentTrustedOrigins(env.APP_URL),
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "mongodb" }),
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
      socialProviders: {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      },
    }
    : {}),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAccountEmail({
        to: user.email,
        subject: "Reset your ConnectSphere Careers password",
        heading: "Reset your password",
        message:
          "Use the secure link below to choose a new password. The link expires automatically.",
        actionLabel: "Reset password",
        actionUrl: url,
      });
    },
    password: {
      hash: (password) => hash(password, 10),
      verify: ({ hash: passwordHash, password }) =>
        compare(password, passwordHash),
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAccountEmail({
        to: user.email,
        subject: "Verify your ConnectSphere Careers email",
        heading: "Verify your email",
        message:
          "Confirm your email address to finish creating your ConnectSphere Careers account.",
        actionLabel: "Verify email",
        actionUrl: url,
      });
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: true,
    },
  },
  user: {
    fields: {
      emailVerified: "isEmailVerified",
    },
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "ACTIVE",
        input: false,
      },
      phoneNumber: {
        type: "string",
        required: false,
      },
      department: {
        type: "string",
        required: false,
        input: false,
      },
      position: {
        type: "string",
        required: false,
        input: false,
      },
      employeeId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
    },
  },
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type === "email-verification") {
          await sendAccountOTP({ to: email, otp });
        }
      },
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      otpLength: 6,
      expiresIn: 10 * 60,
      allowedAttempts: 5,
      storeOTP: "hashed",
      rateLimit: { window: 60, max: 3 },
    }),
    twoFactor({
      issuer: "ConnectSphere Careers",
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 8,
        durationSeconds: 900,
      },
    }),
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
