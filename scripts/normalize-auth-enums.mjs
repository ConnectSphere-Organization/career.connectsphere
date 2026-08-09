import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const normalizations = [
  {
    collection: "users",
    field: "role",
    missingValue: "user",
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
    collection: "users",
    field: "status",
    missingValue: "active",
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
    collection: "users",
    field: "positionLevel",
    missingValue: "Junior",
    values: {
      JUNIOR: "Junior",
      SENIOR: "Senior",
      LEAD: "Lead",
      MANAGER: "Manager",
      DIRECTOR: "Director",
    },
  },
  {
    collection: "designations",
    field: "level",
    values: {
      JUNIOR: "Junior",
      SENIOR: "Senior",
      LEAD: "Lead",
      MANAGER: "Manager",
      DIRECTOR: "Director",
    },
  },
];

async function countLegacyValues({ collection, field, values }) {
  const legacyValues = Object.keys(values);
  const result = await prisma.$runCommandRaw({
    aggregate: collection,
    pipeline: [
      { $match: { [field]: { $in: legacyValues } } },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ],
    cursor: {},
  });

  return result.cursor.firstBatch;
}

async function countMissingValues({ collection, field, missingValue }) {
  if (!missingValue) return 0;

  const result = await prisma.$runCommandRaw({
    count: collection,
    query: {
      $or: [{ [field]: { $exists: false } }, { [field]: null }],
    },
  });

  return result.n;
}

async function normalizeValues({ collection, field, values }) {
  const branches = Object.entries(values).map(([legacyValue, storedValue]) => ({
    case: { $eq: [`$${field}`, legacyValue] },
    then: storedValue,
  }));

  return prisma.$runCommandRaw({
    update: collection,
    updates: [
      {
        q: { [field]: { $in: Object.keys(values) } },
        u: [
          {
            $set: {
              [field]: {
                $switch: {
                  branches,
                  default: `$${field}`,
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

async function fillMissingValue({ collection, field, missingValue }) {
  if (!missingValue) return { n: 0, nModified: 0 };

  return prisma.$runCommandRaw({
    update: collection,
    updates: [
      {
        q: { $or: [{ [field]: { $exists: false } }, { [field]: null }] },
        u: { $set: { [field]: missingValue } },
        multi: true,
      },
    ],
  });
}

try {
  const before = [];
  for (const normalization of normalizations) {
    const values = await countLegacyValues(normalization);
    const missing = await countMissingValues(normalization);
    before.push({
      field: `${normalization.collection}.${normalization.field}`,
      values,
      missing,
    });
  }

  console.log(
    JSON.stringify({ mode: apply ? "apply" : "dry-run", before }, null, 2),
  );

  if (!apply) {
    console.log(
      "Dry run only. Re-run with --apply to normalize legacy values.",
    );
  } else {
    const updates = [];
    for (const normalization of normalizations) {
      const result = await normalizeValues(normalization);
      const missingResult = await fillMissingValue(normalization);
      updates.push({
        field: `${normalization.collection}.${normalization.field}`,
        matched: result.n,
        modified: result.nModified,
        missingMatched: missingResult.n,
        missingModified: missingResult.nModified,
      });
    }

    const remaining = [];
    for (const normalization of normalizations) {
      const values = await countLegacyValues(normalization);
      const missing = await countMissingValues(normalization);
      if (values.length > 0 || missing > 0) {
        remaining.push({
          field: `${normalization.collection}.${normalization.field}`,
          values,
          missing,
        });
      }
    }

    console.log(JSON.stringify({ updates, remaining }, null, 2));
    if (remaining.length > 0) process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}
