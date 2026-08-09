import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const limit = 100;

async function anonymize(profile) {
  const suffix = profile.id.slice(-12);
  const email = `deleted+${suffix}@invalid.local`;
  await prisma.$transaction(async (tx) => {
    await tx.application.updateMany({
      where: { userId: profile.userId },
      data: {
        fullName: "Deleted Candidate",
        email,
        phone: "0000000",
        resume: null,
        resumeUrl: null,
        cloudinaryPublicId: null,
        experience: null,
        education: null,
        skills: [],
        coverLetter: null,
        questionAnswers: [],
      },
    });
    await Promise.all([
      tx.applicationDraft.deleteMany({
        where: { candidateProfileId: profile.id },
      }),
      tx.savedJob.deleteMany({ where: { candidateProfileId: profile.id } }),
      tx.jobAlert.deleteMany({ where: { candidateProfileId: profile.id } }),
      tx.candidateMessage.deleteMany({
        where: { candidateProfileId: profile.id },
      }),
      tx.communicationPreference.deleteMany({
        where: { candidateProfileId: profile.id },
      }),
      tx.session.deleteMany({ where: { userId: profile.userId } }),
      tx.account.deleteMany({ where: { userId: profile.userId } }),
    ]);
    await tx.user.update({
      where: { id: profile.userId },
      data: {
        name: "Deleted Candidate",
        email,
        phoneNumber: null,
        password: null,
        status: "INACTIVE",
        image: null,
      },
    });
    await tx.candidateProfile.update({
      where: { id: profile.id },
      data: {
        primaryEmail: email,
        normalizedEmail: email,
        phone: null,
        anonymizedAt: new Date(),
      },
    });
    await tx.dataSubjectRequest.updateMany({
      where: {
        candidateProfileId: profile.id,
        type: "DELETION",
        status: { in: ["REQUESTED", "VERIFYING", "IN_PROGRESS"] },
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        notes: "Automated anonymization completed by retention worker.",
      },
    });
  });
}

try {
  const profiles = await prisma.candidateProfile.findMany({
    where: { anonymizedAt: null, retentionUntil: { lte: new Date() } },
    orderBy: { retentionUntil: "asc" },
    take: limit,
    select: { id: true, userId: true, retentionUntil: true },
  });
  console.log(
    JSON.stringify({
      mode: apply ? "apply" : "dry-run",
      eligible: profiles.length,
      profiles: profiles.map((profile) => ({
        id: profile.id,
        retentionUntil: profile.retentionUntil,
      })),
    }),
  );
  if (apply) for (const profile of profiles) await anonymize(profile);
} finally {
  await prisma.$disconnect();
}
