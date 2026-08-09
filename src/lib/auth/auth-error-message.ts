const ACCOUNT_NOT_LINKED_MESSAGE =
    "An account already exists with this email. Sign in with your password, then try Google again.";

export function authErrorMessage(code: string | null | undefined): string {
    if (!code) return "Authentication failed. Please try again.";

    switch (code.toUpperCase()) {
        case "ACCOUNT_NOT_LINKED":
            return ACCOUNT_NOT_LINKED_MESSAGE;
        case "INVALID_EMAIL_OR_PASSWORD":
        case "INVALID_EMAIL":
        case "INVALID_PASSWORD":
            return "Invalid email or password. New here? Create an account.";
        default:
            return "Authentication failed. Please try again.";
    }
}