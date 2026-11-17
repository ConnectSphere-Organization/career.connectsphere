import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Parse CLI flags: --uri, --email, --password, --name, --role
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        params[key] = next;
        i++;
      } else {
        params[key] = true;
      }
    }
  }
  return params;
}

const args = parseArgs();

const rawUri =
  args.uri ||
  process.env.MONGODB_URI ||
  "mongodb+srv://vivekkumarprince1_db_user:GWXP32f0N0qfEDzy@cluster0.zknroar.mongodb.net";

const email = (args.email || "vivekkumarprince1@gmail.com").toLowerCase().trim();
const rawPassword = args.password || "Prince1@";
const name = args.name || "Vivek Kumar Prince";
const role = args.role || "ADMIN";

// Ensure database name is in the MongoDB URI if missing
function normalizeMongoUri(uri, defaultDb = "careers") {
  if (!uri) return uri;
  try {
    // If uri is like mongodb+srv://...mongodb.net or ...mongodb.net/ or ...mongodb.net/?...
    const url = new URL(uri);
    if (!url.pathname || url.pathname === "/" || url.pathname === "") {
      url.pathname = `/${defaultDb}`;
      if (!url.searchParams.has("retryWrites")) {
        url.searchParams.set("retryWrites", "true");
      }
      if (!url.searchParams.has("w")) {
        url.searchParams.set("w", "majority");
      }
    }
    if (!url.searchParams.has("tlsAllowInvalidCertificates") && url.protocol.startsWith("mongodb")) {
      url.searchParams.set("tlsAllowInvalidCertificates", "true");
    }
    return url.toString();
  } catch {
    return uri;
  }
}

const mongoUri = normalizeMongoUri(rawUri);

const allPermissions = {
  canGenerateCertificate: true,
  canGenerateOfferLetter: true,
  canCreateJob: true,
  canManageJobs: true,
  canViewApplicants: true,
  canManageReviews: true,
  canManageEmployees: true,
  canManageRecommendations: true,
  canManageCandidateCollaboration: true,
  canManageCommunications: true,
  canAccessDashboard: true,
  canManageInterviews: true,
  canManageAttendance: true,
  canManageLeave: true,
  canManagePayroll: true,
  canManageExits: true,
  canManageDocuments: true,
  canVerifyDocuments: true,
  canManagePrivacy: true,
  canManageIntegrations: true,
  canViewReports: true,
};

async function seedAdmin() {
  console.log("==========================================");
  console.log("ConnectSphere Admin Seeding Script");
  console.log("==========================================");
  console.log(`Target Email: ${email}`);
  console.log(`Target Role:  ${role}`);
  console.log(`Database URI: ${mongoUri.replace(/:([^:@]+)@/, ":****@")}`);
  console.log("------------------------------------------");

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: mongoUri,
      },
    },
  });

  try {
    console.log("Connecting to MongoDB...");
    await prisma.$connect();
    console.log("Connected successfully!");

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: { providerId: "credential" },
        },
      },
    });

    let userId;

    if (existingUser) {
      console.log(`Found existing user (ID: ${existingUser.id}). Updating admin profile...`);
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: role,
          status: "ACTIVE",
          isEmailVerified: true,
          password: hashedPassword,
          permissions: allPermissions,
          updatedAt: new Date(),
        },
      });
      userId = updatedUser.id;
      console.log(`Updated user ${email} to role ${role}`);
    } else {
      console.log(`Creating new admin user for ${email}...`);
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          role: role,
          status: "ACTIVE",
          isEmailVerified: true,
          password: hashedPassword,
          permissions: allPermissions,
        },
      });
      userId = newUser.id;
      console.log(`Created admin user with ID: ${userId}`);
    }

    // Upsert Better Auth credential account
    const existingCredentialAccount = await prisma.account.findFirst({
      where: {
        providerId: "credential",
        userId: userId,
      },
    });

    if (existingCredentialAccount) {
      console.log("Updating existing credential account...");
      await prisma.account.update({
        where: { id: existingCredentialAccount.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });
      console.log("Credential account password updated.");
    } else {
      console.log("Creating new Better Auth credential account...");
      await prisma.account.create({
        data: {
          accountId: userId,
          providerId: "credential",
          userId: userId,
          password: hashedPassword,
        },
      });
      console.log("Credential account created successfully.");
    }

    console.log("------------------------------------------");
    console.log("Admin seeded successfully!");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${rawPassword}`);
    console.log(`Role:     ${role}`);
    console.log("==========================================");
  } catch (error) {
    console.error("Failed to seed admin:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
