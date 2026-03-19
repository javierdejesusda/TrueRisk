export default function MapLoading() {
  return (
    <div className="fixed inset-0 bg-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent-green" />
        <span className="text-sm text-text-muted">Loading TrueRisk Map...</span>
      </div>
    </div>
  );
}
