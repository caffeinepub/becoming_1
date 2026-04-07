import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MONTHS_2026 } from "../constants/months2026";

interface MonthTabsProps {
  selectedMonth: number;
  onMonthChange: (month: number) => void;
}

export function MonthTabs({ selectedMonth, onMonthChange }: MonthTabsProps) {
  return (
    <Tabs
      value={selectedMonth.toString()}
      onValueChange={(value) => onMonthChange(Number.parseInt(value))}
      className="w-full"
    >
      <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted/30 p-0 h-auto flex-wrap">
        {MONTHS_2026.map((month) => (
          <TabsTrigger
            key={month.monthIndex}
            value={month.monthIndex.toString()}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 px-4 py-3 font-medium touch-optimized"
          >
            {month.shortName}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
