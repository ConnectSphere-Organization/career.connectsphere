import { describe, expect, it } from "vitest";

import { hasRoleCapability, isRecruitmentRole } from "@/lib/auth/policy";
import { decryptSecret, encryptSecret } from "@/lib/security/secret-encryption";
import { assertUploadIsClean } from "@/lib/security/upload-scanner";
import {
  attendanceInputSchema,
  interviewRoundInputSchema,
  salaryStructureInputSchema,
} from "@/modules/operations/schema";

const employeeId = "64f000000000000000000001";
const applicationId = "64f000000000000000000002";
const jobId = "64f000000000000000000003";
const interviewerId = "64f000000000000000000004";

describe("platform expansion foundations", () => {
  it("maps specialized roles to scoped capabilities", () => {
    expect(hasRoleCapability("RECRUITER", "canManageInterviews")).toBe(true);
    expect(hasRoleCapability("FINANCE", "canManagePayroll")).toBe(true);
    expect(hasRoleCapability("VERIFIER", "canVerifyDocuments")).toBe(true);
    expect(hasRoleCapability("RECRUITER", "canManagePayroll")).toBe(false);
    expect(isRecruitmentRole("HR")).toBe(true);
  });

  it("validates HRMS, payroll and interview commands", () => {
    expect(
      attendanceInputSchema.parse({
        employeeId,
        date: "2026-07-14",
        status: "PRESENT",
      }).source,
    ).toBe("MANUAL");
    expect(
      salaryStructureInputSchema.safeParse({
        employeeId,
        name: "India salary FY27",
        annualCtc: 1_200_000,
        monthlyGross: 90_000,
        components: { basic: 45_000 },
        effectiveFrom: "2026-04-01",
      }).success,
    ).toBe(true);
    expect(
      interviewRoundInputSchema.safeParse({
        applicationId,
        jobId,
        sequence: 1,
        name: "Technical panel",
        type: "TECHNICAL",
        scheduledStart: "2026-07-20T10:00:00.000Z",
        scheduledEnd: "2026-07-20T11:00:00.000Z",
        interviewerIds: [interviewerId],
      }).success,
    ).toBe(true);
  });

  it("encrypts integration secrets and rejects the EICAR signature", async () => {
    const encrypted = encryptSecret("webhook-signing-secret");
    expect(encrypted).not.toContain("webhook-signing-secret");
    expect(decryptSecret(encrypted)).toBe("webhook-signing-secret");
    const eicar = new File(
      ["X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"],
      "eicar.txt",
      { type: "text/plain" },
    );
    await expect(assertUploadIsClean(eicar)).rejects.toThrow(
      /malware screening/i,
    );
  });
});
