import { expect, test } from "@playwright/test";

import { expectResponsiveDocument } from "./helpers";

const publicRoutes = [
  { path: "/", heading: /Build the systems that keep businesses in conversation/i },
  { path: "/jobs", heading: /Find your place at ConnectSphere/i },
  { path: "/contact", heading: /Contact the ConnectSphere team/i },
  { path: "/login", heading: /Sign in to your account/i },
  { path: "/register", heading: /Create an account/i },
] as const;

for (const route of publicRoutes) {
  test(`${route.path} renders its public landmark without horizontal overflow`, async ({
    page,
  }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { name: route.heading, level: 1 }),
    ).toBeVisible();
    await expectResponsiveDocument(page);
  });
}

test("public navigation remains usable at the active viewport", async ({
  page,
}) => {
  await page.goto("/");
  const mobileNavigation = page.getByRole("navigation", {
    name: "Bottom navigation",
  });
  const desktopNavigation = page.getByRole("navigation", {
    name: "Primary navigation",
  });

  if (await mobileNavigation.isVisible()) {
    await mobileNavigation.getByRole("link", { name: "Jobs" }).click();
  } else {
    await expect(desktopNavigation).toBeVisible();
    await desktopNavigation.getByRole("link", { name: "Jobs" }).click();
  }

  await expect(page).toHaveURL(/\/jobs$/);
  await expect(
    page.getByRole("heading", { name: /Find your place at ConnectSphere/i }),
  ).toBeVisible();
});
