import { expect, type Page } from "@playwright/test";

export async function expectResponsiveDocument(page: Page): Promise<void> {
  await expect(page.locator("body")).toBeVisible();
  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.documentWidth).toBeLessThanOrEqual(
    overflow.viewportWidth + 1,
  );
}

export function envUrl(
  name: "PLAYWRIGHT_TARGET_URL" | "PLAYWRIGHT_LEGACY_URL",
): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value.replace(/\/$/, "") : undefined;
}
