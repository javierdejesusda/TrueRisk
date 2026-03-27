import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="h-screen pt-20 px-6 lg:px-12 pb-12 max-w-5xl mx-auto overflow-y-auto">
      <Skeleton className="h-8 w-52 mb-2" />
      <Skeleton className="h-4 w-72 mb-8" />
      <Skeleton className="h-32 w-32 rounded-full mx-auto mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
