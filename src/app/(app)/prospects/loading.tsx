export default function ProspectsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 bg-muted rounded" />
          <div className="h-3 w-56 bg-muted rounded mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-muted rounded" />
          <div className="h-8 w-28 bg-muted rounded" />
        </div>
      </div>

      {/* Status pills */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-24 bg-muted rounded" />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card/50">
        <div className="border-b px-4 py-3">
          <div className="h-4 w-full bg-muted rounded" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
            <div className="w-4 h-4 bg-muted rounded" />
            <div className="flex-1 h-4 bg-muted rounded" />
            <div className="w-20 h-4 bg-muted rounded" />
            <div className="w-16 h-4 bg-muted rounded" />
            <div className="w-12 h-4 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
