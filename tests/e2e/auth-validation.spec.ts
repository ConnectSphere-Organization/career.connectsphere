import { expect, test } from "@playwright/test";

import { expectResponsiveDocument } from "./helpers";

test("login rejects malformed credentials before sending an auth request", async ({
  page,
}) => {
  let authRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/auth/sign-in")) authRequests += 1;
  });

  await page.goto("/login");
  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByLabel("Password").fill("secret1");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByText("Enter a valid email address", { exact: true }),
  ).toBeVisible();
  expect(authRequests).toBe(0);
  await expectResponsiveDocument(page);
});

test("registration reports mismatched passwords without creating an account", async ({
  page,
}) => {
  let signUpRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/auth/sign-up")) signUpRequests += 1;
  });

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Vivek Kumar");
  await page.getByLabel("Email address").fill("vivek@example.com");
  await page.getByLabel("Phone number").fill("9876543210");
  await page.getByLabel("Password", { exact: true }).fill("secret1");
  await page.getByLabel("Confirm password").fill("secret2");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByText("Passwords do not match", { exact: true }),
  ).toBeVisible();
  expect(signUpRequests).toBe(0);
  await expectResponsiveDocument(page);
});

test("login shows a useful Google account-linking error", async ({ page }) => {
  await page.goto("/login?error=account_not_linked");

  await expect(
    page.getByRole("alert").filter({
      hasText: "An account already exists with this email",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "create a new account" }),
  ).toBeVisible();
});

test("registration shows a useful Google account-linking error", async ({ page }) => {
  await page.goto("/register?error=account_not_linked");

  await expect(
    page.getByRole("alert").filter({
      hasText: "An account already exists with this email",
    }),
  ).toBeVisible();
});

test("email verification page accepts an OTP and offers resend", async ({ page }) => {
  await page.goto("/verify-email?email=vivek%40example.com");

  await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
  await expect(page.getByText("vivek@example.com", { exact: true })).toBeVisible();
  await expect(page.getByLabel("6-digit verification code")).toBeVisible();
  await expect(page.getByRole("button", { name: "Verify email" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Resend code/ })).toBeVisible();
});
