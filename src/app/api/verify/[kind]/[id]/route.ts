import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { calculateDuration } from "@/modules/documents/server/legacy-pdf-renderers";

const objectIdPattern = /^[a-f\d]{24}$/i;

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params;
  if (id.length < 4)
    return NextResponse.json(
      { message: "Invalid identifier" },
      { status: 400 },
    );

  if (kind === "certificate") {
    let certificate: {
      name: string;
      domain: string;
      jobrole: string;
      fromDate: Date;
      toDate: Date;
      issuedBy: string;
      issuedOn: Date;
    } | null = null;

    if (objectIdPattern.test(id)) {
      certificate = await prisma.certificate
        .findUnique({
          where: { id },
          select: {
            name: true,
            domain: true,
            jobrole: true,
            fromDate: true,
            toDate: true,
            issuedBy: true,
            issuedOn: true,
          },
        })
        .catch(() => null);
    } else {
      try {
        const raw = (await prisma.$runCommandRaw({
          find: "certificates",
          filter: {
            $expr: {
              $regexMatch: {
                input: { $toString: "$_id" },
                regex: `${escapeRegex(id)}$`,
                options: "i",
              },
            },
          },
          limit: 1,
        })) as {
          cursor?: {
            firstBatch?: Array<{
              name: string;
              domain: string;
              jobrole: string;
              fromDate: { $date: string } | string | Date;
              toDate: { $date: string } | string | Date;
              issuedBy: string;
              issuedOn: { $date: string } | string | Date;
            }>;
          };
        };

        const match = raw.cursor?.firstBatch?.[0];
        if (match) {
          const parseDate = (d: { $date: string } | string | Date) =>
            typeof d === "object" && d !== null && "$date" in d
              ? new Date(d.$date)
              : new Date(d);
          certificate = {
            name: match.name,
            domain: match.domain,
            jobrole: match.jobrole,
            fromDate: parseDate(match.fromDate),
            toDate: parseDate(match.toDate),
            issuedBy: match.issuedBy,
            issuedOn: parseDate(match.issuedOn),
          };
        }
      } catch {
        certificate = null;
      }
    }

    if (!certificate)
      return NextResponse.json(
        { message: "Certificate not found" },
        { status: 404 },
      );
    return NextResponse.json({
      valid: true,
      kind,
      record: {
        name: certificate.name,
        domain: certificate.domain,
        jobRole: certificate.jobrole,
        startingDate: certificate.fromDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        completionDate: certificate.toDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        duration: calculateDuration(certificate.fromDate, certificate.toDate),
        issuedBy: certificate.issuedBy,
        issuedOn: certificate.issuedOn.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      },
    });
  }

  if (kind === "offer") {
    const offerFilters = objectIdPattern.test(id)
      ? [{ id }, { shortId: id }]
      : [{ shortId: id }];
    const offer = await prisma.offerLetter
      .findFirst({
        where: { OR: offerFilters },
        select: {
          candidateName: true,
          position: true,
          department: true,
          companyName: true,
          offerType: true,
          workType: true,
          status: true,
          issuedOn: true,
          validUntil: true,
        },
      })
      .catch(() => null);
    if (!offer)
      return NextResponse.json(
        { message: "Offer letter not found" },
        { status: 404 },
      );
    return NextResponse.json({
      valid: true,
      kind,
      record: {
        candidateName: offer.candidateName,
        position: offer.position,
        department: offer.department,
        companyName: offer.companyName,
        offerType: offer.offerType,
        workType: offer.workType,
        status: offer.status,
        issuedOn: offer.issuedOn.toLocaleDateString(),
        validUntil: offer.validUntil.toLocaleDateString(),
      },
    });
  }

  if (kind === "document") {
    const document = await prisma.generatedDocument.findUnique({
      where: { verificationCode: id.toUpperCase() },
      select: {
        title: true,
        type: true,
        status: true,
        issuedAt: true,
        expiresAt: true,
        revokedAt: true,
        revocationReason: true,
        employee: {
          select: { employeeCode: true, user: { select: { name: true } } },
        },
      },
    });
    if (!document)
      return NextResponse.json(
        { message: "Controlled document not found" },
        { status: 404 },
      );
    const expired = Boolean(
      document.expiresAt && document.expiresAt <= new Date(),
    );
    const valid = document.status === "VALID" && !expired;
    return NextResponse.json({
      valid,
      kind,
      record: {
        title: document.title,
        documentType: document.type.replaceAll("_", " "),
        status: expired ? "EXPIRED" : document.status,
        recipient: document.employee?.user.name ?? null,
        employeeCode: document.employee?.employeeCode ?? null,
        issuedAt: document.issuedAt.toLocaleDateString(),
        expiresAt: document.expiresAt?.toLocaleDateString() ?? null,
        revokedAt: document.revokedAt?.toLocaleDateString() ?? null,
        revocationReason: document.revocationReason ?? null,
      },
    });
  }

  return NextResponse.json(
    { message: "Unsupported document type" },
    { status: 404 },
  );
}
