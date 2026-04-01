import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="h-full pt-20 px-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto pb-12">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <div className="flex flex-col gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
