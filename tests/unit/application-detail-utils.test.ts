import { describe, expect, it } from "vitest";

import {
  applicationCsv,
  formatApplicationAnswer,
  safeDownloadName,
} from "@/modules/recruitment/applications/detail-utils";

describe("application detail transformations", () => {
  it("formats scalar, checkbox, rating, object, and empty answers", () => {
    expect(formatApplicationAnswer("  Available immediately ").text).toBe(
      "Available immediately",
    );
    expect(formatApplicationAnswer(["TypeScript", "React"]).items).toEqual([
      "TypeScript",
      "React",
    ]);
    expect(formatApplicationAnswer(5).text).toBe("5");
    expect(
      formatApplicationAnswer({ choice: "Remote", confirmed: true }).text,
    ).toBe("choice: Remote; confirmed: true");
    expect(formatApplicationAnswer(null)).toEqual({
      text: "No response",
      items: [],
      isEmpty: true,
    });
  });

  it("exports one stable CSV row and neutralizes formulas in every candidate field", () => {
    const csv = applicationCsv({
      fullName: '=HYPERLINK("bad")',
      email: "candidate@example.com",
      phone: "+123456789",
      skills: ["@SUM(A1:A2)", "TypeScript"],
      experience: "-1+1",
      education: null,
      coverLetter: "ordinary",
      status: "REVIEWING",
      createdAt: new Date("2026-07-12T10:30:00.000Z"),
      jobTitle: "Engineer",
    });
    expect(csv.split("\r\n")).toHaveLength(2);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+123456789");
    expect(csv).toContain("'@SUM(A1:A2)");
    expect(csv).toContain("'-1+1");
    expect(csv).toContain("2026-07-12T10:30:00.000Z");
  });

  it("creates bounded filesystem-safe export names", () => {
    expect(safeDownloadName("Jane Doe / Platform Engineer")).toBe(
      "Jane-Doe-Platform-Engineer",
    );
    expect(safeDownloadName("***")).toBe("application");
    expect(safeDownloadName("x".repeat(100))).toHaveLength(80);
  });
});
