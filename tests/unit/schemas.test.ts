import { EmploymentType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { applicationFieldsSchema } from "@/modules/applications/schema";
import { loginSchema, registrationSchema } from "@/modules/auth/schemas";
import { contactSchema } from "@/modules/contact/schema";
import {
  canTransitionContractStatus,
  contractSubmissionSchema,
} from "@/modules/contracts/schema";
import {
  recommendationModerationSchema,
  recommendationSchema,
} from "@/modules/collaboration/schema";
import { certificateInputSchema } from "@/modules/documents/schema";
import { jobInputSchema } from "@/modules/jobs/schema";
import { bulkPeopleActionSchema } from "@/modules/people/schema";

describe("authentication schemas", () => {
  it("normalizes login email without altering the password", () => {
    expect(
      loginSchema.parse({ email: "User@Example.COM ", password: " secret " }),
    ).toEqual({
      email: "user@example.com",
      password: " secret ",
    });
  });

  it("normalizes registration data and rejects mismatched passwords", () => {
    const valid = registrationSchema.parse({
      name: "  Vivek Kumar  ",
      email: "VIVEK@EXAMPLE.COM ",
      phoneNumber: "(987) 654-3210",
      password: "secret1",
      confirmPassword: "secret1",
    });

    expect(valid).toMatchObject({
      name: "Vivek Kumar",
      email: "vivek@example.com",
      phoneNumber: "9876543210",
    });
    const invalid = registrationSchema.safeParse({
      ...valid,
      confirmPassword: "different",
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success)
      expect(invalid.error.issues[0]).toMatchObject({
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
  });
});

describe("contract onboarding", () => {
  const contract = {
    phone: "9876543210",
    dateOfBirth: "1995-06-10",
    nationality: "Indian",
    street: "1 Example Road",
    city: "Pune",
    state: "Maharashtra",
    zipCode: "411001",
    country: "India",
    emergencyName: "Example Contact",
    emergencyRelationship: "Sibling",
    emergencyPhone: "9876543211",
    emergencyEmail: "contact@example.com",
    idType: "PAN",
    idNumber: "ABCDE1234F",
    accountHolderName: "Vivek Kumar",
    accountNumber: "1234567890",
    bankName: "Example Bank",
    ifscCode: "EXAM0001234",
    accountType: "SAVINGS",
    branch: "Pune",
    position: "Engineer",
    department: "Engineering",
    salary: "INR 1,000,000",
    startDate: "2026-08-01",
    joiningLocation: "Pune",
    workType: "HYBRID",
    reportingManager: "Manager",
    termsAccepted: true,
    privacyPolicyAccepted: true,
  } as const;

  it("requires legal consent and validates all onboarding sections", () => {
    expect(contractSubmissionSchema.safeParse(contract).success).toBe(true);
    expect(
      contractSubmissionSchema.safeParse({ ...contract, termsAccepted: false })
        .success,
    ).toBe(false);
  });

  it("allows only controlled contract workflow transitions", () => {
    expect(canTransitionContractStatus("UNDER_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionContractStatus("APPROVED", "UNDER_REVIEW")).toBe(false);
    expect(canTransitionContractStatus("REJECTED", "APPROVED")).toBe(false);
  });
});

describe("critical public input schemas", () => {
  it("accepts typed application answers and enforces applicant fields", () => {
    const result = applicationFieldsSchema.parse({
      jobIdentifier: "senior-engineer",
      referralId: "",
      fullName: "  Vivek Kumar ",
      email: "vivek@example.com",
      phone: "9876543210",
      experience: "Five years",
      education: "B.Tech",
      skills: "TypeScript",
      coverLetter: "I would be a strong addition to this engineering team.",
      questionAnswers: {
        availability: "Immediate",
        tools: ["TypeScript", "Node.js"],
        rating: 8,
      },
      privacyConsentAccepted: true,
      privacyPolicyVersion: "2026-07-14",
    });

    expect(result.fullName).toBe("Vivek Kumar");
    expect(result.questionAnswers).toEqual({
      availability: "Immediate",
      tools: ["TypeScript", "Node.js"],
      rating: 8,
    });
    expect(
      applicationFieldsSchema.safeParse({
        ...result,
        phone: "123",
        coverLetter: "Too short",
      }).success,
    ).toBe(false);
    expect(
      applicationFieldsSchema.safeParse({
        ...result,
        privacyConsentAccepted: false,
      }).success,
    ).toBe(false);
  });

  it("normalizes contact details and rejects short messages", () => {
    expect(
      contactSchema.parse({
        name: " Vivek ",
        email: "VIVEK@EXAMPLE.COM ",
        message: " A useful careers enquiry. ",
      }),
    ).toEqual({
      name: "Vivek",
      email: "vivek@example.com",
      message: "A useful careers enquiry.",
    });
    expect(
      contactSchema.safeParse({
        name: "Vivek",
        email: "vivek@example.com",
        message: "short",
      }).success,
    ).toBe(false);
  });

  it("validates both referral submission paths and requires candidate awareness", () => {
    expect(
      recommendationSchema.safeParse({
        kind: "NEW_CANDIDATE",
        jobId: "6a54de39ede954fc2c2133d4",
        candidateName: "Asha Sharma",
        candidateEmail: "asha@example.com",
        candidatePhone: "",
        relationship: "Former colleague",
        message:
          "Asha consistently delivered reliable customer-facing products.",
        consentConfirmed: true,
      }).success,
    ).toBe(true);
    expect(
      recommendationSchema.safeParse({
        kind: "EXISTING_APPLICATION",
        applicationId: "6a54de39ede954fc2c2133d4",
        relationship: "Classmate",
        message:
          "I have seen their engineering work and strongly recommend them.",
        consentConfirmed: true,
      }).success,
    ).toBe(true);
    expect(
      recommendationSchema.safeParse({
        kind: "NEW_CANDIDATE",
        jobId: "6a54de39ede954fc2c2133d4",
        candidateName: "Asha Sharma",
        candidateEmail: "asha@example.com",
        candidatePhone: "",
        relationship: "Former colleague",
        message:
          "Asha consistently delivered reliable customer-facing products.",
        consentConfirmed: false,
      }).success,
    ).toBe(false);
  });

  it("requires a reason when HR rejects a referral", () => {
    expect(
      recommendationModerationSchema.safeParse({
        status: "REJECTED",
        adminNotes: null,
      }).success,
    ).toBe(false);
    expect(
      recommendationModerationSchema.safeParse({
        status: "REJECTED",
        adminNotes: "Role requirements do not match the current profile.",
      }).success,
    ).toBe(true);
  });

  it("rejects a certificate whose end date precedes its start date", () => {
    const result = certificateInputSchema.safeParse({
      jobId: "6a54de39ede954fc2c2133d4",
      name: "Vivek Kumar",
      recipientEmail: "vivek@example.com",
      domain: "Engineering",
      jobrole: "Developer",
      fromDate: "2026-07-12",
      toDate: "2026-07-11",
      issuedBy: "ConnectSphere HR",
    });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0]).toMatchObject({
        path: ["toDate"],
        message: "End date must be on or after start date",
      });
  });

  it("applies job defaults while validating publication input", () => {
    const result = jobInputSchema.parse({
      title: "Software Engineer",
      company: "ConnectSphere",
      description: "Build reliable products for customers and internal teams.",
      requirements: ["TypeScript"],
      responsibilities: ["Ship tested features"],
      type: EmploymentType.FULL_TIME,
      isActive: true,
      isPublished: false,
      hrContact: { email: "" },
    });

    expect(result).toMatchObject({
      location: "",
      salary: "",
      department: "",
      hrContact: { name: "", email: "", phone: "" },
    });
    expect(
      jobInputSchema.safeParse({
        ...result,
        hrContact: { ...result.hrContact, email: "invalid" },
      }).success,
    ).toBe(false);
  });
});

describe("bulk people actions", () => {
  it("bounds bulk actions to 100 identifiers", () => {
    const userIds = Array.from({ length: 101 }, (_, index) =>
      index.toString(16).padStart(24, "0"),
    );
    expect(
      bulkPeopleActionSchema.safeParse({
        operation: "status",
        userIds,
        status: "ACTIVE",
      }).success,
    ).toBe(false);
  });
});
