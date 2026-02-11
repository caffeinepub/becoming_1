import { Skeleton } from '@/components/ui/skeleton';
import { HABIT_INFO_WIDTH, getDayColumnClasses } from './habitGridLayout';

export function GridSkeleton() {
  const mockDays = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32" />
      
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Month tabs skeleton */}
        <div className="flex gap-2 p-2 border-b border-border overflow-x-auto">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-16 flex-shrink-0" />
          ))}
        </div>
        
        {/* Grid area with horizontal scroll */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Grid header skeleton */}
            <div className="flex border-b-2 border-border bg-muted/50">
              <div className={`${HABIT_INFO_WIDTH} flex-shrink-0 px-4 py-3 sticky left-0 z-10 bg-muted/50 md:static md:z-auto`}>
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex">
                {mockDays.map((day) => (
                  <div key={day} className={`${getDayColumnClasses()} py-3`}>
                    <Skeleton className="h-4 w-4" />
                  </div>
                ))}
              </div>
            </div>

            {/* Habit rows skeleton */}
            <div className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex">
                  <div className={`${HABIT_INFO_WIDTH} flex-shrink-0 px-3 py-3 sticky left-0 z-10 bg-background md:static md:z-auto`}>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <div className="flex">
                    {mockDays.map((day) => (
                      <div key={day} className={`${getDayColumnClasses()} py-3`}>
                        <Skeleton className="h-4 w-4 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
