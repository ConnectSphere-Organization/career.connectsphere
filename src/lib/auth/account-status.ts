const enabledAccountStatuses = new Set(["ACTIVE", "FORMER"]);

export function normalizeAccountStatus(
  status: string | null | undefined,
): string {
  return (status ?? "ACTIVE").trim().toUpperCase();
}

export function isEnabledAccountStatus(
  status: string | null | undefined,
): boolean {
  return enabledAccountStatuses.has(normalizeAccountStatus(status));
}

export function isActiveAccountStatus(
  status: string | null | undefined,
): boolean {
  return normalizeAccountStatus(status) === "ACTIVE";
}
