export default function AdminLoading() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading administration workspace"
    >
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-px overflow-hidden rounded-lg border bg-slate-200 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse bg-white p-4">
            <div className="h-4 w-24 rounded bg-slate-100" />
            <div className="mt-4 h-7 w-12 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg border bg-white" />
    </div>
  );
}
