import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="h-screen pt-20 px-6 lg:px-12 pb-12 max-w-6xl mx-auto overflow-y-auto">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <Skeleton height="36px" width="200px" className="mb-2" />
          <Skeleton height="16px" width="280px" />
        </div>
        <Skeleton height="40px" width="224px" rounded="lg" />
      </div>

      {/* Bento grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
        {/* Left: Risk overview skeleton */}
        <div className="lg:row-span-2">
          <div className="rounded-2xl border border-border bg-bg-card p-5">
            <Skeleton height="16px" width="120px" className="mb-4" />
            <Skeleton height="64px" width="100px" className="mb-4" />
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton height="12px" width="80px" />
                  <Skeleton height="6px" className="flex-1" rounded="full" />
                  <Skeleton height="12px" width="24px" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top right: Weather skeleton */}
        <div className="rounded-2xl border border-border bg-bg-card p-5">
          <Skeleton height="16px" width="100px" className="mb-4" />
          <Skeleton height="48px" width="80px" className="mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height="40px" />
            ))}
          </div>
        </div>

        {/* Top far right: Alerts skeleton */}
        <div className="rounded-2xl border border-border bg-bg-card p-5">
          <Skeleton height="16px" width="100px" className="mb-4" />
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height="48px" />
            ))}
          </div>
        </div>

        {/* Bottom: Quick actions skeleton */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height="100px" rounded="lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
