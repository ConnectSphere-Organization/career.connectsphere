import { describe, expect, it } from "vitest";

import { formatSalary, isNewJob, parseSalary } from "@/modules/jobs/utils";

describe("job data transforms", () => {
  it.each([
    ["₹1,20,000", 120000],
    ["$85.50/hour", 85.5],
    ["not disclosed", 0],
    [null, 0],
  ])("parses %s into a sortable salary", (input, expected) => {
    expect(parseSalary(input)).toBe(expected);
  });

  it("adds the default rupee marker without replacing an explicit currency", () => {
    expect(formatSalary("120000")).toBe("₹120000");
    expect(formatSalary(" $85 ")).toBe(" $85 ");
    expect(formatSalary(null)).toBeNull();
  });

  it("classifies jobs through seven days old as new", () => {
    const now = new Date("2026-07-12T12:00:00.000Z");
    expect(isNewJob("2026-07-05T12:00:00.000Z", now)).toBe(true);
    expect(isNewJob("2026-07-05T11:59:59.999Z", now)).toBe(false);
  });
});
