import { requireStaffReferrer } from "@/lib/auth/authorization";
import { RecommendationsManager } from "@/modules/collaboration/components/recommendations-manager";
import {
  listOwnedRecommendations,
  listRecommendableApplications,
  listReferralJobs,
} from "@/modules/collaboration/server/recommendations";

export default async function EmployeeRecommendationsPage() {
  const actor = await requireStaffReferrer();
  const [recommendations, candidates, jobs] = await Promise.all([
    listOwnedRecommendations(actor),
    listRecommendableApplications(actor),
    listReferralJobs(),
  ]);
  return (
    <>
      <p className="section-kicker">Staff referrals</p>
      <h1 className="mt-3 text-4xl font-extrabold">Refer great people</h1>
      <p className="mt-3 mb-8 max-w-3xl text-slate-600">
        Employees and administrators can introduce a candidate or endorse an
        existing application. You only see referrals submitted by your own
        account; authorized HR reviewers see assigned-job referrals.
      </p>
      <RecommendationsManager
        recommendations={recommendations}
        candidates={candidates}
        jobs={jobs}
      />
    </>
  );
}
