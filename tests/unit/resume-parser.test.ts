import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";

import { parseResume } from "@/modules/applications/server/resume-parser";

describe("parseResume", () => {
  it("extracts contact details and skills from a text PDF", async () => {
    const document = await PDFDocument.create();
    const page = document.addPage();
    const font = await document.embedFont(StandardFonts.Helvetica);
    page.drawText(
      "Vivek Kumar\nvivek@example.com\n9876543210\nTypeScript React Next.js MongoDB",
      {
        x: 40,
        y: 700,
        size: 12,
        font,
        lineHeight: 18,
      },
    );
    const file = new File([Buffer.from(await document.save())], "resume.pdf", {
      type: "application/pdf",
    });

    await expect(parseResume(file)).resolves.toMatchObject({
      fullName: "Vivek Kumar",
      email: "vivek@example.com",
      phone: "9876543210",
      skills: ["TypeScript", "React", "Next.js", "MongoDB"],
    });
  });

  it("rejects legacy DOC input rather than treating it as DOCX", async () => {
    const file = new File(["document"], "resume.doc", {
      type: "application/msword",
    });
    await expect(parseResume(file)).rejects.toMatchObject({
      status: 415,
      code: "UNSUPPORTED_RESUME_TYPE",
    });
  });

  it("rejects documents above the parser limit", async () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "resume.pdf", {
      type: "application/pdf",
    });
    await expect(parseResume(file)).rejects.toMatchObject({
      status: 413,
      code: "RESUME_TOO_LARGE",
    });
  });
});
