import "server-only";

import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  MONGODB_URI: z.string().url().startsWith("mongodb"),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  APP_URL: z.string().url(),
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  EMAIL_REPLY_TO: optionalString,
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  CONTRACT_ENCRYPTION_KEY: optionalString,
  WEBHOOK_ENCRYPTION_KEY: optionalString,
  RECAPTCHA_SECRET_KEY: optionalString,
  OBSERVABILITY_HTTP_ENDPOINT: optionalString,
  OBSERVABILITY_HTTP_TOKEN: optionalString,
  METRICS_TOKEN: optionalString,
  MALWARE_SCAN_URL: optionalString,
  MALWARE_SCAN_TOKEN: optionalString,
  REQUIRE_PRIVILEGED_MFA: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  RATE_LIMIT_REST_URL: optionalString,
  RATE_LIMIT_REST_TOKEN: optionalString,
});

const developmentFallbacks = {
  MONGODB_URI: "mongodb://localhost:27017/connectsphere?replicaSet=rs0",
  BETTER_AUTH_SECRET: "development-only-secret-change-before-deploying",
  BETTER_AUTH_URL: "http://localhost:3001",
  APP_URL: "http://localhost:3001",
} as const;

const source =
  process.env.NODE_ENV === "production"
    ? process.env
    : { ...developmentFallbacks, ...process.env };

export const env = serverSchema.parse(source);
