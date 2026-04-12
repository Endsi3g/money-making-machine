export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-32 bg-muted rounded" />
          <div className="h-3 w-48 bg-muted rounded mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-muted rounded" />
          <div className="h-8 w-24 bg-muted rounded" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card/50" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-xl border bg-card/50" />
        <div className="h-64 rounded-xl border bg-card/50" />
      </div>

      {/* Cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-48 rounded-xl border bg-card/50" />
        <div className="h-48 rounded-xl border bg-card/50" />
      </div>
    </div>
  );
}
