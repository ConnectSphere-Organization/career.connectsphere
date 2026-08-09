import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const policies = [
  {
    dataCategory: "CANDIDATE_PROFILE",
    retentionDays: 730,
    legalBasis: "Recruitment consent and legitimate hiring records",
  },
  {
    dataCategory: "UNSUCCESSFUL_APPLICATION",
    retentionDays: 730,
    legalBasis: "Defending recruitment decisions and future opportunities",
  },
  {
    dataCategory: "REFERRAL_INVITATION",
    retentionDays: 90,
    legalBasis: "Candidate-authorized referral processing",
  },
  {
    dataCategory: "AUDIT_LOG",
    retentionDays: 2555,
    legalBasis: "Security, compliance, and fraud prevention",
  },
];
for (const policy of policies)
  await prisma.retentionPolicy.upsert({
    where: { dataCategory: policy.dataCategory },
    create: policy,
    update: {
      retentionDays: policy.retentionDays,
      legalBasis: policy.legalBasis,
      isActive: true,
    },
  });
console.log(JSON.stringify({ seeded: policies.length }));
await prisma.$disconnect();
