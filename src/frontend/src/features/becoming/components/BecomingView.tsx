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
  const { data: habits, isLoading, error } = useHabits();
  const { identity, isInitializing } = useInternetIdentity();

  const isAuthenticated = !!identity;

  if (isInitializing || (isAuthenticated && isLoading)) {
    return <GridSkeleton />;
  }

  if (!isAuthenticated) {
    return <AuthRequiredNotice />;
  }

  if (error) {
    return <ErrorBanner error={error as Error} />;
  }

  return (
    <div className="space-y-6">
      <HabitManager disabled={false} />
      
      <div className="glass-surface rounded-lg overflow-hidden">
        <MonthTabs selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        
        <div className="p-4">
          <HabitGrid habits={habits || []} selectedMonth={selectedMonth} disabled={false} />
        </div>
      </div>
    </div>
  );
}
