import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

function isSupportedLegacyPasswordHash(value) {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}

try {
  const users = await prisma.user.findMany({
    where: { password: { not: null } },
    select: {
      id: true,
      password: true,
      isEmailVerified: true,
      updatedAt: true,
      accounts: {
        where: { providerId: "credential" },
        select: { id: true },
        take: 1,
      },
    },
  });

  const candidates = users.filter(
    (user) =>
      user.accounts.length === 0 &&
      isSupportedLegacyPasswordHash(user.password),
  );
  const invalidHashes = users.filter(
    (user) =>
      user.accounts.length === 0 &&
      !isSupportedLegacyPasswordHash(user.password),
  );

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        legacyUsersWithPasswords: users.length,
        credentialAccountsToCreate: candidates.length,
        usersWithUnsupportedPasswordFormat: invalidHashes.length,
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log(
      "Dry run only. Re-run with --apply to create idempotent Better Auth credential accounts.",
    );
    process.exitCode = candidates.length > 0 ? 2 : 0;
  } else {
    let migrated = 0;
    for (const user of candidates) {
      await prisma.$transaction([
        prisma.account.create({
          data: {
            accountId: user.id,
            providerId: "credential",
            userId: user.id,
            password: user.password,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            isEmailVerified: true,
            updatedAt: user.updatedAt ?? new Date(),
          },
        }),
      ]);
      migrated += 1;
    }
    console.log(
      JSON.stringify({
        migrated,
        skippedExisting:
          users.length - candidates.length - invalidHashes.length,
        unsupported: invalidHashes.length,
      }),
    );
  }
} finally {
  await prisma.$disconnect();
}
