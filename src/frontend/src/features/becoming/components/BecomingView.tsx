import { useState } from 'react';
import { MonthTabs } from './MonthTabs';
import { HabitManager } from './HabitManager';
import { HabitGrid } from './HabitGrid';
import { GridSkeleton } from './GridSkeleton';
import { ErrorBanner } from './ErrorBanner';
import { AuthRequiredNotice } from '../../../components/auth/AuthRequiredNotice';
import { useHabits } from '../api/queries';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';

export function BecomingView() {
  const [selectedMonth, setSelectedMonth] = useState(0);
  const { data: habits, isLoading, error, isFetched } = useHabits();
  const { identity, isInitializing } = useInternetIdentity();

  const isAuthenticated = !!identity;

  // Show loading skeleton while initializing or loading
  if (isInitializing || (isAuthenticated && isLoading)) {
    return <GridSkeleton />;
  }

  // Show auth notice if not authenticated
  if (!isAuthenticated) {
    return <AuthRequiredNotice />;
  }

  // Show error banner if backend call failed
  if (error) {
    return <ErrorBanner error={error as Error} />;
  }

  // Only render the grid once we've definitively fetched data
  // This prevents showing empty state while actor is still initializing
  const showGrid = isAuthenticated && isFetched;

  return (
    <div className="space-y-6">
      <HabitManager disabled={false} />
      
      <div className="glass-surface rounded-lg overflow-hidden">
        <MonthTabs selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        
        <div className="p-4">
          {showGrid ? (
            <HabitGrid habits={habits || []} selectedMonth={selectedMonth} disabled={false} />
          ) : (
            <GridSkeleton />
          )}
        </div>
      </div>
    </div>
  );
}
