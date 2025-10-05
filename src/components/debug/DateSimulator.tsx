import { useState } from 'react';
import { Calendar, RefreshCw, ChevronDown, ChevronUp, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useDateSimulator } from '@/contexts/DateSimulatorContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function DateSimulator() {
  const { simulatedDate, isSimulating, setSimulatedDate, resetSimulation, getCurrentDate } = useDateSimulator();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSimulatedDate(date);
    toast({
      title: "Date Simulated",
      description: `System date set to ${format(date, 'PPP')}`,
    });
  };

  const handleToggleSimulation = (enabled: boolean) => {
    if (enabled) {
      setSimulatedDate(new Date());
    } else {
      resetSimulation();
      toast({
        title: "Simulation Disabled",
        description: "System returned to real-time",
      });
    }
  };

  const handleReset = () => {
    resetSimulation();
    toast({
      title: "Reset to Real-Time",
      description: "Date simulation has been disabled",
    });
  };

  const handleSyncDatabase = async () => {
    if (!simulatedDate) return;

    setIsSyncing(true);
    try {
      // Call the edge function to update compliance statuses with test date
      const { error } = await supabase.functions.invoke('test-compliance-update', {
        body: { 
          test_date: format(simulatedDate, 'yyyy-MM-dd')
        }
      });

      if (error) throw error;

      // Invalidate all compliance queries to force refresh
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-periods'] });

      toast({
        title: "Database Synced",
        description: `Compliance statuses updated for ${format(simulatedDate, 'PPP')}`,
      });
    } catch (error: any) {
      console.error('Error syncing database:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync database with simulated date",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const quickPresets = [
    { label: 'End of Month', getValue: () => {
      const d = new Date(getCurrentDate());
      return new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }},
    { label: 'End of Quarter', getValue: () => {
      const d = new Date(getCurrentDate());
      const quarter = Math.ceil((d.getMonth() + 1) / 3);
      return new Date(d.getFullYear(), quarter * 3, 0);
    }},
    { label: 'End of Year', getValue: () => {
      const d = new Date(getCurrentDate());
      return new Date(d.getFullYear(), 11, 31);
    }},
    { label: 'Next Month', getValue: () => {
      const d = new Date(getCurrentDate());
      return new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }},
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isSimulating && (
        <div className="mb-2 bg-warning/90 backdrop-blur-sm text-warning-foreground px-4 py-2 rounded-lg shadow-lg border border-warning/20 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Testing Mode Active</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="ml-auto h-6 px-2 text-xs hover:bg-warning/20"
            >
              Exit
            </Button>
          </div>
        </div>
      )}

      <Card className="card-premium shadow-xl w-80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Date Simulator
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="simulation-toggle" className="text-sm">Enable Simulation</Label>
              <Switch
                id="simulation-toggle"
                checked={isSimulating}
                onCheckedChange={handleToggleSimulation}
              />
            </div>

            {isSimulating && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">Simulated Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {simulatedDate ? format(simulatedDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={simulatedDate || undefined}
                        onSelect={handleDateSelect}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Quick Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {quickPresets.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        onClick={() => handleDateSelect(preset.getValue())}
                        className="text-xs"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSyncDatabase}
                    disabled={isSyncing}
                    className="w-full bg-gradient-primary"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Database
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="w-full"
                  >
                    Reset to Real-Time
                  </Button>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>Real Date:</span>
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(), 'PP')}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>Simulated Date:</span>
                    <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                      {format(simulatedDate, 'PP')}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
