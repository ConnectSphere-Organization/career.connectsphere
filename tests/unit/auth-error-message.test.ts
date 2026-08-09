import { describe, expect, it } from "vitest";

import { authErrorMessage } from "@/lib/auth/auth-error-message";

describe("authErrorMessage", () => {
    it("explains an account-link collision without exposing provider details", () => {
        expect(authErrorMessage("account_not_linked")).toBe(
            "An account already exists with this email. Sign in with your password, then try Google again.",
        );
    });

    it("gives unknown credential users safe signup guidance", () => {
        expect(authErrorMessage("INVALID_EMAIL_OR_PASSWORD")).toBe(
            "Invalid email or password. New here? Create an account.",
        );
    });

    it("does not render an untrusted provider error description", () => {
        expect(authErrorMessage("unexpected_provider_error")).toBe(
            "Authentication failed. Please try again.",
        );
    });
});