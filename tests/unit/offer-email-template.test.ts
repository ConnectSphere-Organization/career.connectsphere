import { describe, expect, it } from "vitest";

import {
  offerEmailSubject,
  renderLegacyOfferEmail,
} from "@/modules/documents/server/offer-email-template";

const input = {
  candidateName: "Vivek Kumar",
  position: "Software Engineer",
  companyName: "ConnectSphere",
  acceptanceUrl: "https://careers.connectsphere.in/offer/respond/token",
  validUntil: new Date("2026-08-20T12:00:00Z"),
  hrContact: { name: "HR Team", email: "hr@example.com", phone: "9876543210" },
  extended: false,
  internship: false,
  year: 2026,
};

describe("legacy offer email parity", () => {
  it("matches the MERN job-offer subject and primary content", () => {
    const html = renderLegacyOfferEmail(input);
    expect(offerEmailSubject(input)).toBe(
      "Job Offer - Software Engineer at ConnectSphere",
    );
    expect(html).toContain("Congratulations, Vivek Kumar!");
    expect(html).toContain("Your official offer letter is attached");
    expect(html).toContain("Review & Accept Offer");
    expect(html).toContain(input.acceptanceUrl);
    expect(html).toContain("20/08/2026");
    expect(html).toContain("The HR Team @ ConnectSphere");
    expect(html).toContain("People Operations • ConnectSphere");
  });

  it("matches the MERN extension subject and content", () => {
    const extended = { ...input, extended: true };
    const html = renderLegacyOfferEmail(extended);
    expect(offerEmailSubject(extended)).toBe(
      "Offer Validity Extended - Software Engineer at ConnectSphere",
    );
    expect(html).toContain("Offer Validity Extended");
    expect(html).toContain("We've updated your offer details");
    expect(html).toContain("View Updated Offer");
    expect(html).toContain("ConnectSphere Talent Acquisition");
  });
});
