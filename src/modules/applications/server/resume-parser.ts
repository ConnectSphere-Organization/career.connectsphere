import "server-only";

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import { ApiError } from "@/lib/http/api-error";

const maximumBytes = 5 * 1024 * 1024;
const maximumTextLength = 100_000;
const supportedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export type ParsedResume = {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  textPreview: string;
};

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (file.type === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      return (await parser.getText({ first: 20 })).text;
    } finally {
      await parser.destroy();
    }
  }
  return (await mammoth.extractRawText({ buffer })).value;
}

export async function parseResume(file: File): Promise<ParsedResume> {
  if (file.size === 0)
    throw new ApiError("Resume is required", 400, "INVALID_RESUME");
  if (file.size > maximumBytes)
    throw new ApiError(
      "Resume must be 5 MB or smaller for parsing",
      413,
      "RESUME_TOO_LARGE",
    );
  if (!supportedTypes.has(file.type))
    throw new ApiError(
      "Resume parsing supports PDF and DOCX files",
      415,
      "UNSUPPORTED_RESUME_TYPE",
    );
  let text: string;
  try {
    text = (await extractText(file))
      .replace(/\0/g, "")
      .slice(0, maximumTextLength);
  } catch {
    throw new ApiError(
      "Resume could not be parsed; continue by entering details manually",
      422,
      "RESUME_PARSE_FAILED",
    );
  }
  if (!text.trim())
    throw new ApiError(
      "No readable text was found; continue manually",
      422,
      "RESUME_EMPTY",
    );
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const email =
    text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/i)?.[0]?.toLowerCase() ?? null;
  const phone =
    text
      .match(/(?:\+?91[\s-]?)?[6-9]\d{9}/)?.[0]
      ?.replace(/\D/g, "")
      .slice(-10) ?? null;
  const fullName =
    lines.find(
      (line) =>
        /^[A-Za-z][A-Za-z .'-]{2,79}$/.test(line) &&
        !/resume|curriculum|vitae/i.test(line),
    ) ?? null;
  const knownSkills = [
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Python",
    "Java",
    "MongoDB",
    "PostgreSQL",
    "AWS",
    "Azure",
    "Docker",
    "Kubernetes",
    "Prisma",
  ];
  const skills = knownSkills.filter((skill) =>
    new RegExp(`\\b${skill.replace(".", "\\.")}\\b`, "i").test(text),
  );
  return {
    fullName,
    email,
    phone,
    skills,
    textPreview: text.replace(/\s+/g, " ").trim().slice(0, 500),
  };
}
