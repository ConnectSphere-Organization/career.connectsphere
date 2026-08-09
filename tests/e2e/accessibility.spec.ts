import { expect, test } from "@playwright/test";

for (const path of ["/", "/jobs", "/company", "/contact", "/login"] as const) {
  test(`${path} has keyboard-visible primary interaction and labelled form controls`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();
    const unlabeledInputs = await page
      .locator(
        "input:not([type=hidden]):not([aria-label]):not([aria-labelledby])",
      )
      .evaluateAll(
        (inputs) =>
          inputs.filter(
            (input) =>
              !input.id ||
              !document.querySelector(`label[for="${CSS.escape(input.id)}"]`),
          ).length,
      );
    expect(unlabeledInputs).toBe(0);
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
    const outline = await focused.evaluate(
      (element) => getComputedStyle(element).outlineStyle,
    );
    expect(outline).not.toBe("none");
  });
}
