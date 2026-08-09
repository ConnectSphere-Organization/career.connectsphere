import { describe, expect, it } from "vitest";

import {
  employeeIdForUser,
  employeeRoleAfterHire,
  employmentProfileAfterHire,
} from "@/modules/recruitment/applications/employee-promotion";

describe("employee promotion", () => {
  it("promotes a candidate account to employee", () => {
    expect(employeeRoleAfterHire("USER")).toBe("EMPLOYEE");
  });

  it.each(["EMPLOYEE", "ADMIN", "SUPER_ADMIN"] as const)(
    "preserves the %s role",
    (role) => {
      expect(employeeRoleAfterHire(role)).toBe(role);
    },
  );

  it("creates a stable employee ID from the complete user ID", () => {
    expect(employeeIdForUser("6a54de39ede954fc2c2133d4")).toBe(
      "EMP6A54DE39EDE954FC2C2133D4",
    );
    expect(employeeIdForUser("abc-123")).toBe("EMP00ABC123");
  });

  it("uses offer employment details before job defaults", () => {
    expect(
      employmentProfileAfterHire({
        offer: {
          position: "Senior Engineer",
          department: "Platform",
          reportingManager: "Asha",
        },
        job: {
          title: "Engineer",
          position: "Software Engineer",
          department: "Engineering",
          reportingManager: "Vivek",
        },
      }),
    ).toEqual({
      position: "Senior Engineer",
      department: "Platform",
      reportingManager: "Asha",
    });
  });

  it("falls back to job details when no offer exists", () => {
    expect(
      employmentProfileAfterHire({
        offer: null,
        job: {
          title: "Designer",
          position: null,
          department: null,
          reportingManager: null,
        },
      }),
    ).toEqual({
      position: "Designer",
      department: "General",
      reportingManager: null,
    });
  });
});
