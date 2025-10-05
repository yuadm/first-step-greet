import { useTestMode } from '@/contexts/TestModeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Calendar, Clock, RotateCcw } from 'lucide-react';
import { getPresetDate } from '@/lib/test-mode-utils';
import { useState } from 'react';
import { format } from 'date-fns';

interface TestModePanelProps {
  frequency?: string;
}

export function TestModePanel({ frequency = 'quarterly' }: TestModePanelProps) {
  const { isTestMode, simulatedDate, setTestMode, setSimulatedDate } = useTestMode();
  const [isOpen, setIsOpen] = useState(false);

  const handlePreset = (preset: string) => {
    const newDate = getPresetDate(preset, new Date(), frequency);
    setSimulatedDate(newDate);
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const newDate = new Date(simulatedDate);
    newDate.setHours(hours, minutes);
    setSimulatedDate(newDate);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        variant="secondary"
        size="lg"
      >
        <Clock className="mr-2 h-4 w-4" />
        Test Mode
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Test Mode
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </Button>
        </div>
        <CardDescription>
          Simulate different dates to test compliance behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable Test Mode */}
        <div className="flex items-center justify-between">
          <Label htmlFor="test-mode-toggle" className="font-semibold">
            Enable Test Mode
          </Label>
          <Switch
            id="test-mode-toggle"
            checked={isTestMode}
            onCheckedChange={setTestMode}
          />
        </div>

        {isTestMode && (
          <>
            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Simulated Date
              </Label>
              <DatePicker
                selected={simulatedDate}
                onChange={(date) => date && setSimulatedDate(date)}
                placeholder="Select date"
              />
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time
              </Label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={simulatedDate.getHours()}
                  onChange={(e) => handleTimeChange(parseInt(e.target.value), simulatedDate.getMinutes())}
                  className="w-20 px-3 py-2 border rounded-md"
                  placeholder="HH"
                />
                <span className="self-center">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={simulatedDate.getMinutes()}
                  onChange={(e) => handleTimeChange(simulatedDate.getHours(), parseInt(e.target.value))}
                  className="w-20 px-3 py-2 border rounded-md"
                  placeholder="MM"
                />
              </div>
            </div>

            {/* Current Simulated Time Display */}
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
              {format(simulatedDate, 'PPpp')}
            </div>

            {/* Preset Buttons */}
            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset('endOfPeriod')}
                >
                  End of Period
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset('startOfNextPeriod')}
                >
                  Next Period
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset('1YearAgo')}
                >
                  1 Year Ago
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset('5YearsAgo')}
                >
                  5 Years Ago
                </Button>
              </div>
            </div>

            {/* Reset Button */}
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                setTestMode(false);
                setSimulatedDate(new Date());
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Now
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
