import type { UserRole } from "@prisma/client";

type EmploymentSource = {
  position?: string | null;
  department?: string | null;
  reportingManager?: string | null;
};

export function employeeRoleAfterHire(role: UserRole): UserRole {
  return role === "USER" ? "EMPLOYEE" : role;
}

export function employeeIdForUser(userId: string): string {
  const normalized = userId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `EMP${normalized.padStart(8, "0")}`;
}

export function employmentProfileAfterHire({
  offer,
  job,
}: {
  offer?: EmploymentSource | null;
  job: EmploymentSource & { title: string };
}) {
  return {
    position: offer?.position || job.position || job.title,
    department: offer?.department || job.department || "General",
    reportingManager: offer?.reportingManager || job.reportingManager || null,
  };
}
