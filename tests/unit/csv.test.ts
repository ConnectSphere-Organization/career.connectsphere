import { describe, expect, it } from "vitest";

import {
  CsvError,
  csvRecords,
  parseCsv,
  protectCsvFormula,
  stringifyCsv,
} from "@/lib/csv";

describe("CSV utilities", () => {
  it("parses quoted commas, escaped quotes, and embedded newlines", () => {
    expect(parseCsv('name,notes\r\n"Doe, Jane","Line 1\nLine ""2"""')).toEqual([
      ["name", "notes"],
      ["Doe, Jane", 'Line 1\nLine "2"'],
    ]);
  });

  it("rejects malformed quoted fields", () => {
    expect(() => parseCsv('name\n"unclosed')).toThrow(CsvError);
    expect(() => parseCsv('name\n"closed"junk')).toThrow(
      "Unexpected character",
    );
  });

  it("enforces byte, row, column, and cell limits", () => {
    expect(() => parseCsv("abcd", { maxBytes: 3 })).toThrow("exceeds 3 bytes");
    expect(() => parseCsv("a\nb", { maxRows: 1 })).toThrow("exceeds 1 rows");
    expect(() => parseCsv("a,b", { maxColumns: 1 })).toThrow(
      "exceeds 1 columns",
    );
    expect(() => parseCsv("abcd", { maxCellCharacters: 3 })).toThrow(
      "exceeds 3 characters",
    );
  });

  it("validates headers and row width", () => {
    expect(
      csvRecords(parseCsv("name,email\nJane,jane@example.com"), [
        "name",
        "email",
      ]),
    ).toEqual([{ name: "Jane", email: "jane@example.com" }]);
    expect(() => csvRecords(parseCsv("name\nJane"), ["name", "email"])).toThrow(
      "Missing required headers",
    );
    expect(() =>
      csvRecords(parseCsv("name,email\nJane"), ["name", "email"]),
    ).toThrow("Expected 2 columns");
  });

  it("neutralizes spreadsheet formulas in exports", () => {
    expect(protectCsvFormula(" =SUM(A1:A2)")).toBe("' =SUM(A1:A2)");
    expect(
      stringifyCsv([
        ["name", "value"],
        ["Jane", "+cmd|' /C calc'!A0"],
      ]),
    ).toContain("'+cmd|' /C calc'!A0");
    expect(protectCsvFormula("ordinary text")).toBe("ordinary text");
  });
});
