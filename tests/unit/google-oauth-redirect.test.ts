import { describe, expect, it } from "vitest";

import {
  CAREER_ACCOUNT_HOME,
  googleOAuthCallbackURL,
  googleOAuthErrorCallbackURL,
  googleOAuthNewUserCallbackURL,
} from "@/lib/auth/google-oauth-redirect";

describe("career Google OAuth redirects", () => {
  it("sends a new Google user to the candidate dashboard", () => {
    expect(googleOAuthNewUserCallbackURL()).toBe(CAREER_ACCOUNT_HOME);
  });

  it("uses the candidate dashboard when login has no safe redirect", () => {
    expect(googleOAuthCallbackURL(null)).toBe(CAREER_ACCOUNT_HOME);
    expect(googleOAuthCallbackURL("https://evil.example")).toBe(
      CAREER_ACCOUNT_HOME,
    );
  });

  it("preserves a safe in-app destination for an existing user", () => {
    expect(googleOAuthCallbackURL("/apply/platform-engineer")).toBe(
      "/apply/platform-engineer",
    );
  });

  it("returns OAuth failures to the page that started authentication", () => {
    expect(googleOAuthErrorCallbackURL("login", "/apply/platform-engineer")).toBe(
      "/login?redirect=%2Fapply%2Fplatform-engineer",
    );
    expect(googleOAuthErrorCallbackURL("register", null)).toBe("/register");
  });
});
