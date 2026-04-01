import { Skeleton } from '@/components/ui/skeleton';

export default function MapLoading() {
  return (
    <div className="h-full w-screen bg-bg-primary">
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  );
}
