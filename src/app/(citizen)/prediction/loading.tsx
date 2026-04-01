import { Skeleton } from '@/components/ui/skeleton';

export default function PredictionLoading() {
  return (
    <div className="h-full pt-20 px-6 lg:px-12 pb-12 max-w-7xl mx-auto overflow-y-auto">
      <Skeleton className="h-10 w-40 mb-2" />
      <Skeleton className="h-5 w-64 mb-6" />
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
