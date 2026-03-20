import { Skeleton } from '@/components/ui/skeleton';

export default function MapLoading() {
  return (
    <div className="h-screen w-screen bg-bg-primary">
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  );
}
