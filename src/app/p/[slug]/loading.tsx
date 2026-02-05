export default function PersonaLoading() {
  return (
    <main className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Header Skeleton */}
      <header className="w-full border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="h-7 w-24 bg-[var(--muted)] rounded-lg animate-pulse"></div>
          <div className="flex items-center gap-4">
            <div className="h-5 w-16 bg-[var(--muted)] rounded animate-pulse"></div>
            <div className="h-5 w-16 bg-[var(--muted)] rounded animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Content Skeleton */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        <div className="space-y-10">
          {/* Profile Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--muted)] animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-7 w-40 bg-[var(--muted)] rounded-lg animate-pulse"></div>
                <div className="h-4 w-24 bg-[var(--muted)] rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-[var(--muted)] w-16 h-14 animate-pulse"></div>
              <div className="px-4 py-2 rounded-xl bg-[var(--muted)] w-16 h-14 animate-pulse"></div>
              <div className="px-4 py-2 rounded-xl bg-[var(--muted)] w-16 h-14 animate-pulse"></div>
              <div className="px-4 py-2 rounded-xl bg-[var(--muted)] w-16 h-14 animate-pulse"></div>
            </div>
          </div>

          {/* Tasks Skeleton */}
          <div className="space-y-6">
            <div className="h-7 w-24 bg-[var(--muted)] rounded-lg animate-pulse"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[var(--border)] border-l-4 border-l-[var(--muted)] bg-[var(--card)] p-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="h-6 w-48 bg-[var(--muted)] rounded-lg animate-pulse"></div>
                        <div className="h-3 w-32 bg-[var(--muted)] rounded mt-2 animate-pulse"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 w-16 bg-[var(--muted)] rounded-full animate-pulse"></div>
                        <div className="h-6 w-20 bg-[var(--muted)] rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-4 w-3/4 bg-[var(--muted)] rounded animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-[var(--muted)] rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
