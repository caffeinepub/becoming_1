import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface HabitRowActionsPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  children: React.ReactNode;
}

export function HabitRowActionsPopover({ open, onOpenChange, onEdit, children }: HabitRowActionsPopoverProps) {
  const handleEdit = () => {
    onEdit();
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleEdit}
        >
          <Pencil className="h-4 w-4" />
          Edit habit
        </Button>
      </PopoverContent>
    </Popover>
  );
}
