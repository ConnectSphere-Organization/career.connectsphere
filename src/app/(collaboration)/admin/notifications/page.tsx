import { requireCollaboration } from "@/lib/auth/authorization";
import { listAdminNotifications } from "@/modules/collaboration/server/notifications";

export default async function AdminNotificationsPage() {
  await requireCollaboration("canManageEmployees");
  const notifications = await listAdminNotifications();
  return (
    <>
      <p className="section-kicker">Administration</p>
      <h1 className="mt-3 text-4xl font-extrabold">Notification visibility</h1>
      <p className="mt-2 text-slate-600">
        Recent user notifications, visible only to authorized employee
        administrators.
      </p>
      <div className="mt-8 space-y-3">
        {notifications.map((item) => (
          <article key={item.id} className="rounded-2xl border bg-white p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <h2 className="font-bold">{item.title}</h2>
              <span className="text-xs font-bold text-slate-500">
                {item.priority} · {item.createdAt.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="mt-2 text-slate-700">{item.message}</p>
            <p className="mt-2 text-xs text-slate-500">
              Recipient: {item.user.name} ({item.user.email}) ·{" "}
              {item.isRead ? "Read" : "Unread"}
            </p>
          </article>
        ))}
        {notifications.length === 0 ? (
          <p className="rounded-2xl border bg-white p-6 text-slate-500">
            No notifications.
          </p>
        ) : null}
      </div>
    </>
  );
}
