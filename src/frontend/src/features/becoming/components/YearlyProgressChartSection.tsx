import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { type HabitWithCompletion } from '../state/habitModel';
import { aggregateYearlyTotalsByHabit } from '../state/habitModel';
import { MONTHS_2026 } from '../constants/months2026';

interface YearlyProgressChartSectionProps {
  habits: HabitWithCompletion[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-lg border p-3 shadow-lg"
      style={{
        backgroundColor: 'oklch(var(--popover))',
        borderColor: 'oklch(var(--border))',
      }}
    >
      <p className="text-sm font-semibold mb-2" style={{ color: 'oklch(var(--foreground))' }}>
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => {
          const isHours = entry.dataKey === 'Plank' || entry.dataKey === 'Squash';
          const unit = isHours ? ' hours' : ' reps';
          const displayValue = entry.value.toFixed(isHours ? 2 : 0);
          
          return (
            <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span style={{ color: 'oklch(var(--muted-foreground))' }}>
                {entry.name}:
              </span>
              <span className="font-medium" style={{ color: 'oklch(var(--foreground))' }}>
                {displayValue}{unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function YearlyProgressChartSection({ habits }: YearlyProgressChartSectionProps) {
  const chartData = useMemo(() => {
    const yearlyTotals = aggregateYearlyTotalsByHabit(habits);
    
    return MONTHS_2026.map((month, index) => ({
      month: month.shortName,
      'Press-ups': yearlyTotals.pressUps[index],
      'Squats': yearlyTotals.squats[index],
      'Plank': yearlyTotals.plankHours[index],
      'Squash': yearlyTotals.squashHours[index],
    }));
  }, [habits]);

  // Check if there's any volume tracking data for the four specific habits
  const hasData = habits.some((h) => {
    const normalizedName = h.name.toLowerCase().trim();
    return (
      normalizedName === 'press-ups' ||
      normalizedName === 'squats' ||
      normalizedName === 'plank' ||
      normalizedName === 'squash'
    );
  });

  // Don't render if no relevant habits have volume tracking
  if (!hasData) {
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
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="rect"
          />
          <Bar
            dataKey="Press-ups"
            stackId="stack"
            fill="oklch(0.55 0.20 250)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="Squats"
            stackId="stack"
            fill="oklch(0.65 0.18 250)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="Plank"
            stackId="stack"
            fill="oklch(0.45 0.02 250)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="Squash"
            stackId="stack"
            fill="oklch(0.60 0.02 250)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
