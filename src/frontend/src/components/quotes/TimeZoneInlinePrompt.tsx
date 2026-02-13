import { useState } from 'react';
import { useActorWithTimeout } from '@/hooks/useActorWithTimeout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TimeZone } from '@/backend';

interface TimeZoneInlinePromptProps {
  onTimeZoneSet: () => void;
}

const TIME_ZONES = [
  { value: '-720', label: 'UTC-12:00' },
  { value: '-660', label: 'UTC-11:00' },
  { value: '-600', label: 'UTC-10:00 (Hawaii)' },
  { value: '-540', label: 'UTC-09:00 (Alaska)' },
  { value: '-480', label: 'UTC-08:00 (Pacific)' },
  { value: '-420', label: 'UTC-07:00 (Mountain)' },
  { value: '-360', label: 'UTC-06:00 (Central)' },
  { value: '-300', label: 'UTC-05:00 (Eastern)' },
  { value: '-240', label: 'UTC-04:00 (Atlantic)' },
  { value: '-180', label: 'UTC-03:00' },
  { value: '-120', label: 'UTC-02:00' },
  { value: '-60', label: 'UTC-01:00' },
  { value: '0', label: 'UTC+00:00 (London)' },
  { value: '60', label: 'UTC+01:00 (Paris)' },
  { value: '120', label: 'UTC+02:00 (Cairo)' },
  { value: '180', label: 'UTC+03:00 (Moscow)' },
  { value: '240', label: 'UTC+04:00 (Dubai)' },
  { value: '300', label: 'UTC+05:00' },
  { value: '330', label: 'UTC+05:30 (India)' },
  { value: '360', label: 'UTC+06:00' },
  { value: '420', label: 'UTC+07:00 (Bangkok)' },
  { value: '480', label: 'UTC+08:00 (Singapore)' },
  { value: '540', label: 'UTC+09:00 (Tokyo)' },
  { value: '600', label: 'UTC+10:00 (Sydney)' },
  { value: '660', label: 'UTC+11:00' },
  { value: '720', label: 'UTC+12:00 (Auckland)' },
];

export function TimeZoneInlinePrompt({ onTimeZoneSet }: TimeZoneInlinePromptProps) {
  const { actor } = useActorWithTimeout();
  const [selectedOffset, setSelectedOffset] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedOffset) {
      toast.error('Please select a time zone');
      return;
    }

    if (!actor) {
      toast.error('Not connected to backend');
      return;
    }

    setIsSaving(true);

    try {
      const offsetMinutes = parseInt(selectedOffset, 10);
      const selectedTz = TIME_ZONES.find((tz) => tz.value === selectedOffset);
      
      const timeZone: TimeZone = {
        utcOffsetMinutes: BigInt(offsetMinutes),
        name: selectedTz?.label || `UTC${offsetMinutes >= 0 ? '+' : ''}${offsetMinutes / 60}`,
      };

      await actor.setUserTimeZone(timeZone);
      toast.success('Time zone saved successfully');
      onTimeZoneSet();
    } catch (error: any) {
      console.error('Failed to save time zone:', error);
      toast.error('Failed to save time zone: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Alert className="glass-surface border-primary/20">
      <Clock className="h-5 w-5 text-primary" />
      <AlertDescription className="mt-2">
        <p className="text-sm text-foreground mb-4">
          Set your time zone to see your daily motivational quote
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedOffset} onValueChange={setSelectedOffset}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Select your time zone" />
            </SelectTrigger>
            <SelectContent>
              {TIME_ZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleSave}
            disabled={!selectedOffset || isSaving}
            className="cyber-primary-glow"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Time Zone'
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
