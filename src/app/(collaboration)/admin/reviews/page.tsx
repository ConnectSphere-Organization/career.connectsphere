import { requireCollaboration } from "@/lib/auth/authorization";
import { ModerationList } from "@/modules/collaboration/components/moderation-list";
import { listReviewsForModeration } from "@/modules/collaboration/server/reviews";

export default async function AdminReviewsPage() {
  await requireCollaboration("canManageReviews");
  const reviews = await listReviewsForModeration();
  const items = reviews.map((review) => ({
    id: review.id,
    title: review.title,
    subtitle: `${review.userName} · ${review.rating}/5 · ${review.reviewerType}`,
    body: review.content,
    status: review.status,
    details: [
      review.pros ? `Pros: ${review.pros}` : "",
      review.cons ? `Cons: ${review.cons}` : "",
      review.advice ? `Advice: ${review.advice}` : "",
    ].filter(Boolean),
  }));
  return (
    <>
      <p className="section-kicker">Moderation</p>
      <h1 className="mt-3 text-4xl font-extrabold">Employee reviews</h1>
      <p className="mt-3 mb-8 text-slate-600">
        Approve or reject pending public reviews. Decisions are audited.
      </p>
      <ModerationList kind="reviews" items={items} />
    </>
  );
}
