import "server-only";

import { prisma } from "@/lib/db/prisma";

type RunCommandRaw = (command: Record<string, unknown>) => Promise<unknown>;

const userEnumNormalizations = [
  {
    field: "role",
    values: {
      USER: "user",
      ADMIN: "admin",
      EMPLOYEE: "employee",
      SUPER_ADMIN: "super-admin",
      super_admin: "super-admin",
      RECRUITER: "recruiter",
      MANAGER: "manager",
      FINANCE: "finance",
      HR: "hr",
      VERIFIER: "verifier",
      PAYROLL_ADMIN: "payroll-admin",
      PLATFORM_OWNER: "owner",
    },
  },
  {
    field: "status",
    values: {
      ACTIVE: "active",
      INACTIVE: "inactive",
      FORMER: "former",
      SUSPENDED: "suspended",
      deleted: "former",
      removed: "former",
    },
  },
  {
    field: "positionLevel",
    values: {
      JUNIOR: "Junior",
      SENIOR: "Senior",
      LEAD: "Lead",
      MANAGER: "Manager",
      DIRECTOR: "Director",
    },
  },
] as const;

export function isOAuthCallbackPath(pathname: string): boolean {
  return pathname.includes("/api/auth/callback/");
}

export async function normalizeLegacyAuthEnums(
  runCommandRaw: RunCommandRaw = (command) =>
    prisma.$runCommandRaw(command as never),
): Promise<void> {
  for (const normalization of userEnumNormalizations) {
    const branches = Object.entries(normalization.values).map(
      ([legacyValue, storedValue]) => ({
        case: { $eq: [`$${normalization.field}`, legacyValue] },
        then: storedValue,
      }),
    );

    await runCommandRaw({
      update: "users",
      updates: [
        {
          q: {
            [normalization.field]: {
              $in: Object.keys(normalization.values),
            },
          },
          u: [
            {
              $set: {
                [normalization.field]: {
                  $switch: {
                    branches,
                    default: `$${normalization.field}`,
                  },
                },
              },
            },
          ],
          multi: true,
        },
      ],
    });
  }
}
