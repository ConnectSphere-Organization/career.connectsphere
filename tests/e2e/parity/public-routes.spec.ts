import { expect, test } from "@playwright/test";

import { envUrl } from "../helpers";

const targetUrl = envUrl("PLAYWRIGHT_TARGET_URL");
const legacyUrl = envUrl("PLAYWRIGHT_LEGACY_URL");
const hasDualAppEnvironment = Boolean(targetUrl && legacyUrl);

const sharedRoutes = ["/", "/jobs", "/login", "/register"] as const;

test.describe("dual-app public route parity", () => {
  test.skip(
    !hasDualAppEnvironment,
    "Set PLAYWRIGHT_TARGET_URL and PLAYWRIGHT_LEGACY_URL to reachable isolated apps.",
  );

  for (const route of sharedRoutes) {
    test(`${route} is successful in both applications`, async ({ request }) => {
      const [targetResponse, legacyResponse] = await Promise.all([
        request.get(`${targetUrl}${route}`),
        request.get(`${legacyUrl}${route}`),
      ]);

      expect(targetResponse.status(), `target ${route}`).toBeLessThan(400);
      expect(legacyResponse.status(), `legacy ${route}`).toBeLessThan(400);
      expect(targetResponse.headers()["content-type"]).toContain("text/html");
      expect(legacyResponse.headers()["content-type"]).toContain("text/html");
    });
  }
});
