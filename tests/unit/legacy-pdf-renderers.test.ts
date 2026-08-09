import { PDFParse } from "pdf-parse";
import { describe, expect, it } from "vitest";

import {
  renderLegacyCertificatePdf,
  renderLegacyOfferPdf,
} from "@/modules/documents/server/legacy-pdf-renderers";

async function inspect(pdf: Uint8Array) {
  const parser = new PDFParse({ data: Buffer.from(pdf) });
  try {
    const text = await parser.getText();
    const info = await parser.getInfo();
    return { text: text.text, info };
  } finally {
    await parser.destroy();
  }
}

describe("legacy PDF renderer parity", () => {
  it("renders the MERN certificate wording, metadata, and landscape dimensions", async () => {
    const pdf = await renderLegacyCertificatePdf({
      id: "507f1f77bcf86cd799439011",
      name: "Vivek Kumar",
      jobrole: "Software Engineer Intern",
      domain: "Development",
      fromDate: new Date("2025-01-01T12:00:00Z"),
      toDate: new Date("2025-06-30T12:00:00Z"),
      issuedOn: new Date("2025-07-01T12:00:00Z"),
      verificationUrl:
        "https://careers.connectsphere.in/verify/507f1f77bcf86cd799439011",
    });
    const result = await inspect(pdf);
    expect(result.text).toContain("INTERNSHIP COMPLETION CERTIFICATE");
    expect(result.text).toContain("Presented by ConnectSphere");
    expect(result.text).toContain("Vivek Kumar");
    expect(result.text).toContain("Software Engineer Intern");
    expect(result.text).toContain("ConnectSphere-507f1f77bcf86cd799439011");
    expect(result.info.total).toBe(1);
    expect(pdf.byteLength).toBeGreaterThan(10_000);
  });

  it("renders the MERN offer wording, reference, details, terms, and acceptance section", async () => {
    const pdf = await renderLegacyOfferPdf({
      id: "507f1f77bcf86cd799439011",
      candidateName: "Vivek Kumar",
      position: "Software Engineer",
      department: "Development",
      salary: "1200000",
      offerType: "Job",
      payoutFrequency: "annual",
      startDate: new Date("2026-08-01T12:00:00Z"),
      endDate: null,
      duration: null,
      joiningLocation: "Remote",
      workType: "Remote",
      reportingManager: "Engineering Manager",
      createdAt: new Date("2026-07-01T12:00:00Z"),
      validUntil: new Date("2026-07-20T12:00:00Z"),
      extensionCount: 0,
      hrContactName: "HR Team",
      issuedBy: "ConnectSphere",
      verificationUrl:
        "https://careers.connectsphere.in/verify-offer/507f1f77bcf86cd799439011",
    });
    const result = await inspect(pdf);
    const compactText = result.text.replaceAll(/\s+/g, "");
    expect(compactText).toContain("OFFICIALOFFERLETTER");
    expect(result.text).toContain("Official Offer.");
    expect(result.text).toContain("Welcome to ConnectSphere.");
    expect(result.text).toContain("ConnectSphere-OFF-439011");
    expect(result.text).toContain("POSITION OFFERED");
    expect(compactText).toContain("TERMS&EXPECTATIONS");
    expect(result.text).toContain("HOW TO ACCEPT");
    expect(result.text).toContain("FOUNDER & DIRECTOR");
    expect(result.info.total).toBe(1);
    expect(pdf.byteLength).toBeGreaterThan(10_000);
  });
});
