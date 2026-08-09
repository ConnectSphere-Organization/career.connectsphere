import { Download } from "lucide-react";
import { notFound } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { requireRecruitment } from "@/lib/auth/authorization";
import { ApiError } from "@/lib/http/api-error";
import { allowedContractStatusTransitions } from "@/modules/contracts/schema";
import { ContractStatusControl } from "@/modules/contracts/components/contract-status-control";
import { getRedactedContract } from "@/modules/contracts/server/contracts";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRecruitment("canViewApplicants");
  const { id } = await params;
  let contract;
  try {
    contract = await getRedactedContract(id, actor);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const detail = (label: string, value: string | null | undefined) => (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase">{label}</p>
      <p className="mt-1 font-semibold">{value || "—"}</p>
    </div>
  );
  return (
    <>
      <p className="section-kicker">Contract review</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-extrabold">{contract.candidateName}</h1>
        <a
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 font-bold text-white"
          href={`/api/recruitment/contracts/${id}/download`}
        >
          <Download className="size-4" />
          Protected PDF
        </a>
      </div>
      <p className="mt-2 text-slate-600">
        {contract.status.replaceAll("_", " ")} · submitted{" "}
        {contract.createdAt.toLocaleDateString("en-IN")}
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
              <h2 className="text-xl font-bold sm:col-span-2">
                Personal information
              </h2>
              {detail("Email", contract.email)}
              {detail("Phone", contract.phone)}
              {detail(
                "Date of birth",
                contract.personalInfo?.dateOfBirth?.toLocaleDateString("en-IN"),
              )}
              {detail("Nationality", contract.personalInfo?.nationality)}
              {detail(
                "Identity type",
                contract.personalInfo?.identificationDocuments?.idType,
              )}
              {detail(
                "Identity number",
                contract.personalInfo?.identificationDocuments?.idNumber,
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
              <h2 className="text-xl font-bold sm:col-span-2">
                Banking (masked)
              </h2>
              {detail(
                "Account holder",
                contract.bankingInfo?.accountHolderName,
              )}
              {detail("Account number", contract.bankingInfo?.accountNumber)}
              {detail("Bank", contract.bankingInfo?.bankName)}
              {detail("IFSC / routing", contract.bankingInfo?.ifscCode)}
              {detail("Account type", contract.bankingInfo?.accountType)}
              {detail("Branch", contract.bankingInfo?.branch)}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
              <h2 className="text-xl font-bold sm:col-span-2">Employment</h2>
              {detail("Position", contract.employmentDetails?.position)}
              {detail("Department", contract.employmentDetails?.department)}
              {detail("Compensation", contract.employmentDetails?.salary)}
              {detail(
                "Start date",
                contract.employmentDetails?.startDate?.toLocaleDateString(
                  "en-IN",
                ),
              )}
              {detail(
                "Work type",
                contract.employmentDetails?.workType?.replace("_", " "),
              )}
              {detail("Location", contract.employmentDetails?.joiningLocation)}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold">Private documents</h2>
              <ul className="mt-4 divide-y divide-slate-100">
                {contract.documents.map((document) =>
                  document.id ? (
                    <li
                      key={document.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <span>
                        {document.fileName ??
                          document.documentType ??
                          "Document"}
                      </span>
                      <a
                        className="font-bold text-emerald-700"
                        href={`/api/recruitment/contracts/${id}/documents/${document.id}`}
                      >
                        Download
                      </a>
                    </li>
                  ) : null,
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold">Review status</h2>
            <p className="mt-2 text-sm text-slate-500">
              Transitions use optimistic concurrency and are recorded in audit
              logs.
            </p>
            <div className="mt-5">
              <ContractStatusControl
                id={id}
                transitions={allowedContractStatusTransitions(contract.status)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
