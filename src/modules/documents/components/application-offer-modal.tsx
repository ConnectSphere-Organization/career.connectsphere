import { OfferGenerationModal } from "@/modules/documents/components/offer-generation-modal";
import type { OfferInput } from "@/modules/documents/schema";

export function ApplicationOfferModal({
  applicationId,
  initialValues,
}: {
  applicationId: string;
  initialValues: Partial<OfferInput>;
}) {
  return (
    <OfferGenerationModal
      applicationId={applicationId}
      initialValues={initialValues}
      fullWidth
    />
  );
}
