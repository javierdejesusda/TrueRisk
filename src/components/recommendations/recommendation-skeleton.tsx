import { Skeleton } from '@/components/ui/skeleton';

export function RecommendationSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton width="100%" height="14px" />
      <Skeleton width="92%" height="14px" />
      <Skeleton width="85%" height="14px" />
      <Skeleton width="96%" height="14px" />
      <Skeleton width="70%" height="14px" />
      <div className="pt-1">
        <Skeleton width="40%" height="14px" />
      </div>
    </div>
  );
}
