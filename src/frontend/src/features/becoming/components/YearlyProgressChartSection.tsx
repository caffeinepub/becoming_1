import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { type HabitWithCompletion } from '../state/habitModel';
import { aggregateYearlyTotals } from '../state/habitModel';
import { MONTHS_2026 } from '../constants/months2026';

interface YearlyProgressChartSectionProps {
  habits: HabitWithCompletion[];
}

export function YearlyProgressChartSection({ habits }: YearlyProgressChartSectionProps) {
  const chartData = useMemo(() => {
    const yearlyTotals = aggregateYearlyTotals(habits);
    
    return MONTHS_2026.map((month, index) => ({
      month: month.shortName,
      'Total Reps': yearlyTotals.reps[index],
      'Total Time (hours)': yearlyTotals.timeHours[index],
    }));
  }, [habits]);

  // Check if there's any volume tracking data
  const hasReps = habits.some((h) => h.volumeTracking?.unitType === 'reps');
  const hasTime = habits.some((h) => h.volumeTracking?.unitType === 'time');

  // Don't render if no habits have volume tracking
  if (!hasReps && !hasTime) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="glass-surface rounded-lg p-4 mb-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Yearly Progress</h3>
        <p className="text-xs text-muted-foreground mt-1">{currentYear} Overview</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="month"
            tick={{ fill: 'oklch(var(--muted-foreground))', fontSize: 12 }}
            tickLine={{ stroke: 'oklch(var(--border))' }}
            axisLine={{ stroke: 'oklch(var(--border))' }}
          />
          <YAxis
            tick={{ fill: 'oklch(var(--muted-foreground))', fontSize: 12 }}
            tickLine={{ stroke: 'oklch(var(--border))' }}
            axisLine={{ stroke: 'oklch(var(--border))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'oklch(var(--popover))',
              border: '1px solid oklch(var(--border))',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'oklch(var(--foreground))' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="rect"
          />
          {hasReps && (
            <Bar
              dataKey="Total Reps"
              fill="oklch(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          )}
          {hasTime && (
            <Bar
              dataKey="Total Time (hours)"
              fill="oklch(var(--muted-foreground))"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
