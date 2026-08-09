export default function PublicLoading() {
  return (
    <div
      className="min-h-[70vh] animate-pulse bg-white px-6 py-20"
      role="status"
      aria-label="Loading page"
    >
      <div className="mx-auto max-w-7xl">
        <div className="h-7 w-40 rounded-md bg-blue-100" />
        <div className="mt-8 h-16 max-w-2xl rounded-2xl bg-slate-200" />
        <div className="mt-4 h-16 max-w-xl rounded-2xl bg-slate-100" />
        <div className="mt-8 h-6 max-w-2xl rounded-lg bg-slate-100" />
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}
