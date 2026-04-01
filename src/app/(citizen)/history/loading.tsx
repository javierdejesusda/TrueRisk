import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function HistoryLoading() {
  return (
    <div className="h-full pt-20 px-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto pb-12">
        {/* Header skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <Skeleton width="200px" height="32px" className="mb-2" />
            <Skeleton width="280px" height="16px" />
          </div>
          <div className="flex items-end gap-3">
            <Skeleton width="180px" height="36px" rounded="lg" />
            <Skeleton width="192px" height="52px" rounded="lg" />
          </div>
        </div>

        {/* Chart skeleton */}
        <Card variant="glass" className="mb-6">
          <Skeleton width="120px" height="14px" className="mb-4" />
          <Skeleton width="100%" height="280px" rounded="lg" />
        </Card>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} variant="glass">
              <Skeleton width="60%" height="12px" className="mb-2" />
              <Skeleton width="40%" height="28px" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
