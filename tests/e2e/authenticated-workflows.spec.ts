import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const candidateEmail = process.env.E2E_CANDIDATE_EMAIL;
const candidatePassword = process.env.E2E_CANDIDATE_PASSWORD;
const jobIdentifier = process.env.E2E_JOB_IDENTIFIER;

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test("privileged user can reach recruitment and permission-scoped operations", async ({
  page,
}) => {
  test.skip(
    !adminEmail || !adminPassword,
    "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD for authenticated proof",
  );
  await login(page, adminEmail!, adminPassword!);
  await page.goto("/recruitment");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/admin/operations");
  await expect(
    page.getByRole("heading", {
      name: /HR, payroll, exits, documents and interviews/i,
    }),
  ).toBeVisible();
});

test("candidate application draft survives refresh", async ({ page }) => {
  test.skip(
    !candidateEmail || !candidatePassword || !jobIdentifier,
    "Set candidate credentials and E2E_JOB_IDENTIFIER for the apply journey",
  );
  await login(page, candidateEmail!, candidatePassword!);
  await page.goto(`/apply/${jobIdentifier}`);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel(/phone number/i).fill("+15555550123");
  await page.getByLabel(/resume/i).setInputFiles({
    name: "resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%%EOF"),
  });
  await page.getByRole("button", { name: /continue/i }).click();
  await page
    .getByLabel(/experience/i)
    .fill("Five years of relevant product and operations experience.");
  await page.getByLabel(/skills/i).fill("Operations, communication, analysis");
  await page.reload();
  await expect(page.getByText(/saved draft was restored/i)).toBeVisible();
  await expect(page.getByLabel(/experience/i)).toHaveValue(/Five years/);
});
