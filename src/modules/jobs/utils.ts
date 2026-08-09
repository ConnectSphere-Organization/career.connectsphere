export function parseSalary(value: string | null): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatSalary(value: string | null): string | null {
  if (!value) return null;
  if (/^[₹$€£]/.test(value.trim())) return value;
  return `₹${value}`;
}

export function isNewJob(createdAt: Date | string, now = new Date()): boolean {
  const posted = new Date(createdAt);
  const difference = Math.abs(now.getTime() - posted.getTime());
  return Math.ceil(difference / 86_400_000) <= 7;
}
