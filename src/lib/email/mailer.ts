import "server-only";

import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";

import { env } from "@/config/env";

let transporter: nodemailer.Transporter | undefined;
let readinessCache: { ready: boolean; expiresAt: number } | undefined;

type DevelopmentEmail = {
  id: string;
  recipient: string;
  subject: string;
  heading: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
  createdAt: string;
};

const developmentMailbox: DevelopmentEmail[] = [];

export function isDevelopmentMailboxEnabled(): boolean {
  return env.NODE_ENV !== "production";
}

export function listDevelopmentEmails(): readonly DevelopmentEmail[] {
  return isDevelopmentMailboxEnabled() ? developmentMailbox.toReversed() : [];
}

function storeDevelopmentEmail(
  input: Omit<DevelopmentEmail, "id" | "createdAt">,
): void {
  developmentMailbox.push({
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  });
  if (developmentMailbox.length > 50)
    developmentMailbox.splice(0, developmentMailbox.length - 50);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    throw new Error("Email delivery is not configured");
  }

  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  });
  return transporter;
}

export async function verifyEmailTransport(): Promise<void> {
  const now = Date.now();
  if (readinessCache && readinessCache.expiresAt > now) {
    if (!readinessCache.ready) throw new Error("Email delivery is unavailable");
    return;
  }

  try {
    await getTransporter().verify();
    readinessCache = { ready: true, expiresAt: now + 60_000 };
  } catch {
    if (isDevelopmentMailboxEnabled()) {
      readinessCache = { ready: true, expiresAt: now + 60_000 };
      return;
    }
    readinessCache = { ready: false, expiresAt: now + 15_000 };
    throw new Error("Email delivery is unavailable");
  }
}
export async function sendAccountEmail({
  to,
  subject,
  heading,
  message,
  actionLabel,
  actionUrl,
}: {
  to: string;
  subject: string;
  heading: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
}) {
  try {
    await getTransporter().sendMail({
      from: `ConnectSphere Careers <${env.SMTP_USER}>`,
      replyTo: env.EMAIL_REPLY_TO,
      to,
      subject,
      text: `${heading}\n\n${message}\n\n${actionLabel}: ${actionUrl}`,
      html: `<div style="background:#f8fafc;padding:32px;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:32px"><p style="color:#047857;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">ConnectSphere Careers</p><h1 style="font-size:28px;margin:12px 0">${escapeHtml(heading)}</h1><p style="line-height:1.7;color:#475569">${escapeHtml(message)}</p><a href="${escapeHtml(actionUrl)}" style="display:inline-block;margin-top:20px;background:#059669;color:#fff;text-decoration:none;padding:13px 20px;border-radius:12px;font-weight:700">${escapeHtml(actionLabel)}</a><p style="margin-top:24px;font-size:12px;color:#64748b">If you did not request this, no action is required.</p></div></div>`,
    });
  } catch (error) {
    if (!isDevelopmentMailboxEnabled()) throw error;
    storeDevelopmentEmail({
      recipient: to,
      subject,
      heading,
      message,
      actionLabel,
      actionUrl,
    });
  }
}

export async function sendAccountOTP({
  to,
  otp,
}: {
  to: string;
  otp: string;
}): Promise<void> {
  try {
    await getTransporter().sendMail({
      from: `ConnectSphere Careers <${env.SMTP_USER}>`,
      replyTo: env.EMAIL_REPLY_TO,
      to,
      subject: `${otp} is your ConnectSphere Careers verification code`,
      text: `Verify your email\n\nYour verification code is ${otp}. It expires in 10 minutes.\n\nIf you did not request this, no action is required.`,
      html: `<div style="background:#f8fafc;padding:32px;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:32px"><p style="color:#047857;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">ConnectSphere Careers</p><h1 style="font-size:28px;margin:12px 0">Verify your email</h1><p style="line-height:1.7;color:#475569">Enter this code to finish creating your account:</p><p style="font-size:36px;font-weight:800;letter-spacing:.18em;margin:24px 0;color:#0f172a">${escapeHtml(otp)}</p><p style="font-size:14px;color:#64748b">This code expires in 10 minutes. If you did not request this, no action is required.</p></div></div>`,
    });
  } catch (error) {
    if (!isDevelopmentMailboxEnabled()) throw error;
    storeDevelopmentEmail({
      recipient: to,
      subject: `${otp} is your ConnectSphere Careers verification code`,
      heading: "Verify your email",
      message: `Your verification code is ${otp}. It expires in 10 minutes.`,
      actionLabel: "Verification code",
      actionUrl: otp,
    });
  }
}

