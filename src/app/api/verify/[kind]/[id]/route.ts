import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

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
    const certificateFilters =
      id.length === 24
        ? [{ id }, { id: { endsWith: id } }]
        : [{ id: { endsWith: id } }];
    const certificate = await prisma.certificate
      .findFirst({
        where: { OR: certificateFilters },
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
        fromDate: certificate.fromDate.toLocaleDateString(),
        toDate: certificate.toDate.toLocaleDateString(),
        issuedBy: certificate.issuedBy,
        issuedOn: certificate.issuedOn.toLocaleDateString(),
      },
    });
  }

  if (kind === "offer") {
    const offerFilters =
      id.length === 24 ? [{ id }, { shortId: id }] : [{ shortId: id }];
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
