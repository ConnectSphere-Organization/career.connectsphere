import { requireCollaboration } from "@/lib/auth/authorization";
import { ModerationList } from "@/modules/collaboration/components/moderation-list";
import {
  listRecommendationsForModeration,
  recommendationStatistics,
} from "@/modules/collaboration/server/recommendations";

export default async function AdminRecommendationsPage() {
  const actor = await requireCollaboration("canManageRecommendations");
  const [recommendations, statistics] = await Promise.all([
    listRecommendationsForModeration(actor),
    recommendationStatistics(actor),
  ]);
  const items = recommendations.map((item) => ({
    id: item.id,
    title: item.recommendedUserName,
    subtitle: `${item.job.title} · referred by ${item.recommenderUser.name}`,
    body: item.recommendationMessage ?? "No recommendation supplied",
    status: item.status,
    details: [
      item.recommendedUserEmail,
      item.relationship ? `Relationship: ${item.relationship}` : "",
      item.consentConfirmed
        ? "Candidate awareness confirmed"
        : "Consent not recorded",
      item.application
        ? `Application: ${item.application.status}`
        : item.invitationSentAt
          ? "Invitation sent · awaiting application"
          : "No application yet",
    ].filter(Boolean),
    ...(item.application
      ? {
          href: `/recruitment/applications/${item.application.slug ?? item.application.id}`,
          actionLabel: "Open application",
        }
      : {}),
  }));
  return (
    <>
      <p className="section-kicker">Referral review</p>
      <h1 className="mt-3 text-4xl font-extrabold">Employee referrals</h1>
      <p className="mt-3 text-slate-600">
        Review referrals for jobs in your assigned scope. Record a review,
        select strong candidates, or reject with a clear reason.
      </p>
      <div className="my-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(statistics).map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-white p-4">
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
              {label}
            </p>
            <p className="mt-2 text-2xl font-extrabold">
              {value}
              {label === "selectionRate" ? "%" : ""}
            </p>
          </div>
        ))}
      </div>
      <ModerationList kind="recommendations" items={items} />
    </>
  );
}
