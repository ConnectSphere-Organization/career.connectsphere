import { requireEmployee } from "@/lib/auth/authorization";
import { ReviewSubmissionForm } from "@/modules/collaboration/components/review-submission-form";
import { getOwnReview } from "@/modules/collaboration/server/reviews";

export default async function EmployeeReviewPage() {
  const actor = await requireEmployee({ allowFormer: true });
  const review = await getOwnReview(actor);
  return (
    <div className="mx-auto max-w-3xl">
      <p className="section-kicker">Employee voice</p>
      <h1 className="mt-3 text-4xl font-extrabold">Share your experience</h1>
      <p className="mt-3 mb-8 text-slate-600">
        One review is allowed per employee account. Submissions remain private
        until approved.
      </p>
      <ReviewSubmissionForm review={review} />
    </div>
  );
}
