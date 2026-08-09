import { requireCollaborationActor } from "@/lib/auth/authorization";
import { NotificationsList } from "@/modules/collaboration/components/notifications-list";
import { listNotifications } from "@/modules/collaboration/server/notifications";

export default async function NotificationsPage() {
  const actor = await requireCollaborationActor();
  const result = await listNotifications(actor.id);
  return (
    <div className="mx-auto max-w-4xl">
      <p className="section-kicker">Inbox</p>
      <h1 className="mt-3 text-4xl font-extrabold">Notifications</h1>
      <p className="mt-3 mb-8 text-slate-600">
        Account, application, and job updates addressed only to this account.
      </p>
      <NotificationsList {...result} />
    </div>
  );
}
