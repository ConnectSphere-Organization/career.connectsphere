import { stringifyCsv } from "@/lib/csv";

export type DisplayAnswer = {
  text: string;
  items: readonly string[];
  isEmpty: boolean;
};

export function formatApplicationAnswer(value: unknown): DisplayAnswer {
  if (value == null || value === "")
    return { text: "No response", items: [], isEmpty: true };
  if (Array.isArray(value)) {
    const items = value.map(formatScalar).filter((item) => item.length > 0);
    return {
      text: items.length ? items.join(", ") : "No response",
      items,
      isEmpty: items.length === 0,
    };
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).map(
      ([key, item]) => `${key}: ${formatScalar(item)}`,
    );
    return {
      text: entries.length ? entries.join("; ") : "No response",
      items: entries,
      isEmpty: entries.length === 0,
    };
  }
  const text = formatScalar(value);
  return { text: text || "No response", items: [], isEmpty: !text };
}

function formatScalar(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
}

export type ApplicationCsvData = {
  fullName: string;
  email: string;
  phone: string;
  skills: readonly string[];
  experience: string | null;
  education: string | null;
  coverLetter: string | null;
  status: string;
  createdAt: Date;
  jobTitle: string;
};

export function applicationCsv(data: ApplicationCsvData): string {
  return stringifyCsv([
    [
      "Name",
      "Email",
      "Phone",
      "Job",
      "Skills",
      "Experience",
      "Education",
      "Cover Letter",
      "Status",
      "Applied At",
    ],
    [
      data.fullName,
      data.email,
      data.phone,
      data.jobTitle,
      data.skills.join("; "),
      data.experience,
      data.education,
      data.coverLetter,
      data.status,
      data.createdAt.toISOString(),
    ],
  ]);
}

export function safeDownloadName(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.slice(0, 80) || "application";
}
