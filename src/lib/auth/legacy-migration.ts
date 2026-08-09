export function isSupportedLegacyPasswordHash(
  value: string | null | undefined,
): value is string {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}

export function needsCredentialAccountMigration(input: {
  password: string | null;
  credentialAccountCount: number;
}): boolean {
  return (
    input.credentialAccountCount === 0 &&
    isSupportedLegacyPasswordHash(input.password)
  );
}
