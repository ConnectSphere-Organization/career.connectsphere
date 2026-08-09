export const CSV_LIMITS = {
  maxBytes: 1_000_000,
  maxRows: 500,
  maxColumns: 40,
  maxCellCharacters: 10_000,
} as const;

type CsvLimits = Partial<Record<keyof typeof CSV_LIMITS, number>>;

export class CsvError extends Error {
  constructor(
    message: string,
    readonly row?: number,
  ) {
    super(message);
    this.name = "CsvError";
  }
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function parseCsv(input: string, limits: CsvLimits = {}): string[][] {
  const config = { ...CSV_LIMITS, ...limits };
  if (utf8Bytes(input) > config.maxBytes)
    throw new CsvError(`CSV exceeds ${config.maxBytes} bytes`);
  const source = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let quoteClosed = false;

  const pushField = () => {
    if (field.length > config.maxCellCharacters)
      throw new CsvError(
        `Cell exceeds ${config.maxCellCharacters} characters`,
        rows.length + 1,
      );
    row.push(field);
    if (row.length > config.maxColumns)
      throw new CsvError(
        `Row exceeds ${config.maxColumns} columns`,
        rows.length + 1,
      );
    field = "";
    quoteClosed = false;
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    if (rows.length > config.maxRows)
      throw new CsvError(`CSV exceeds ${config.maxRows} rows`, rows.length);
    row = [];
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index] ?? "";
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          quoteClosed = true;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (
      quoteClosed &&
      character !== "," &&
      character !== "\r" &&
      character !== "\n"
    ) {
      throw new CsvError(
        "Unexpected character after closing quote",
        rows.length + 1,
      );
    }
    if (character === '"') {
      if (field.length > 0)
        throw new CsvError(
          "Quote must begin at the start of a field",
          rows.length + 1,
        );
      quoted = true;
    } else if (character === ",") {
      pushField();
    } else if (character === "\n") {
      pushRow();
    } else if (character === "\r") {
      if (source[index + 1] === "\n") index += 1;
      pushRow();
    } else {
      field += character;
      if (field.length > config.maxCellCharacters)
        throw new CsvError(
          `Cell exceeds ${config.maxCellCharacters} characters`,
          rows.length + 1,
        );
    }
  }
  if (quoted) throw new CsvError("Unclosed quoted field", rows.length + 1);
  if (field.length > 0 || row.length > 0) pushRow();
  return rows;
}

const dangerousFormulaPrefix = /^[\t\r ]*[=+\-@]/;

export function protectCsvFormula(value: string): string {
  return dangerousFormulaPrefix.test(value) ? `'${value}` : value;
}

function encodeCell(value: string): string {
  const protectedValue = protectCsvFormula(value);
  return /[",\r\n]/.test(protectedValue)
    ? `"${protectedValue.replaceAll('"', '""')}"`
    : protectedValue;
}

export function stringifyCsv(
  rows: readonly (readonly (string | number | boolean | null | undefined)[])[],
): string {
  return rows
    .map((row) =>
      row
        .map((value) => encodeCell(value == null ? "" : String(value)))
        .join(","),
    )
    .join("\r\n");
}

export function csvRecords(
  rows: string[][],
  requiredHeaders: readonly string[],
): Record<string, string>[] {
  if (rows.length === 0) throw new CsvError("CSV is empty");
  const headers = rows[0]?.map((header) => header.trim()) ?? [];
  if (new Set(headers).size !== headers.length)
    throw new CsvError("CSV headers must be unique", 1);
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length > 0)
    throw new CsvError(`Missing required headers: ${missing.join(", ")}`, 1);
  return rows
    .slice(1)
    .filter((values) => values.some((value) => value.trim()))
    .map((values, index) => {
      if (values.length !== headers.length)
        throw new CsvError(
          `Expected ${headers.length} columns but found ${values.length}`,
          index + 2,
        );
      return Object.fromEntries(
        headers.map((header, column) => [header, values[column] ?? ""]),
      );
    });
}
