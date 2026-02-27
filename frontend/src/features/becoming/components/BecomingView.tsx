import { useState } from 'react';
import { MonthTabs } from './MonthTabs';
import { HabitManager } from './HabitManager';
import { HabitGrid } from './HabitGrid';
import { GridSkeleton } from './GridSkeleton';
import { ErrorBanner } from './ErrorBanner';
import { AuthRequiredNotice } from '../../../components/auth/AuthRequiredNotice';
import { YearlyProgressChartSection } from './YearlyProgressChartSection';
import { MonthlyVolumeSummary } from './MonthlyVolumeSummary';
import { useHabits } from '../api/queries';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';

export function BecomingView() {
  const [selectedMonth, setSelectedMonth] = useState(0);
  const { data: habits, isLoading, error, isFetched, isError, retry } = useHabits();
  const { identity, isInitializing } = useInternetIdentity();

  const isAuthenticated = !!identity;

  // Show auth notice if not authenticated
  if (!isAuthenticated && !isInitializing) {
    return <AuthRequiredNotice />;
  }

  // Show error banner if backend call failed (actor init or habits query)
  if (isAuthenticated && isError && error) {
    return <ErrorBanner error={error} onRetry={retry} />;
  }

  // Show loading skeleton while initializing or loading (bounded by timeout)
  if (isInitializing || (isAuthenticated && isLoading)) {
    return <GridSkeleton />;
  }

  // Only render the grid once we've definitively fetched data
  const showGrid = isAuthenticated && isFetched;

  return (
    <div className="space-y-6">
      <HabitManager disabled={false} />
      
      {showGrid && habits && habits.length > 0 && (
        <>
          <YearlyProgressChartSection habits={habits} />
          <MonthlyVolumeSummary habits={habits} selectedMonth={selectedMonth} />
        </>
      )}
      
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
