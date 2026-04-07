import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useAddHabit } from "../api/queries";

interface HabitManagerProps {
  disabled?: boolean;
}

export function HabitManager({ disabled = false }: HabitManagerProps) {
  const [habitName, setHabitName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const addHabitMutation = useAddHabit();

  const handleAddHabit = async () => {
    if (!habitName.trim() || disabled) return;

    await addHabitMutation.mutateAsync(habitName.trim());
    setHabitName("");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Enter") {
      handleAddHabit();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setHabitName("");
    }
  };

  if (!isAdding) {
    return (
      <div className="flex justify-start">
        <Button
          onClick={() => setIsAdding(true)}
          variant="outline"
          size="sm"
          className="gap-2 touch-optimized"
          disabled={disabled}
        >
          <Plus className="h-4 w-4 text-accent" />
          Add Habit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <Input
        type="text"
        placeholder="Enter habit name..."
        value={habitName}
        onChange={(e) => setHabitName(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        className="max-w-xs touch-optimized"
        disabled={disabled}
      />
      <Button
        onClick={handleAddHabit}
        disabled={!habitName.trim() || addHabitMutation.isPending || disabled}
        size="sm"
        className="touch-optimized cyber-primary-glow"
      >
        {addHabitMutation.isPending ? "Adding..." : "Add"}
      </Button>
      <Button
        onClick={() => {
          setIsAdding(false);
          setHabitName("");
        }}
        variant="ghost"
        size="sm"
        disabled={disabled}
        className="touch-optimized"
      >
        Cancel
      </Button>
    </div>
  );
}
