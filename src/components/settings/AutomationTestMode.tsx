import { useState } from "react";
import { Calendar, Play, Info, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function AutomationTestMode() {
  const [testDate, setTestDate] = useState<Date>();
  const [dryRun, setDryRun] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const runComplianceAutomation = async () => {
    if (!testDate) {
      toast({
        title: "Select a date",
        description: "Please select a test date first",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('compliance-automation', {
        body: { 
          test_date: testDate.toISOString(),
          dry_run: dryRun
        }
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: dryRun ? "Dry Run Complete" : "Automation Complete",
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to run automation",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runLeaveAutomation = async () => {
    if (!testDate) {
      toast({
        title: "Select a date",
        description: "Please select a test date first",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);

    try {
      const { data, error } = await supabase.functions.invoke('leave-automation', {
        body: { 
          test_date: testDate.toISOString(),
          dry_run: dryRun
        }
      });

      if (error) throw error;

      toast({
        title: dryRun ? "Dry Run Complete" : "Leave Automation Complete",
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to run leave automation",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runNotifications = async () => {
    if (!testDate) {
      toast({
        title: "Select a date",
        description: "Please select a test date first",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);

    try {
      const { data, error } = await supabase.functions.invoke('compliance-notifications', {
        body: { 
          test_date: testDate.toISOString(),
          dry_run: dryRun
        }
      });

      if (error) throw error;

      toast({
        title: dryRun ? "Dry Run Complete" : "Notifications Complete",
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to run notifications",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="border-warning">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-warning" />
          <CardTitle>🧪 Automation Test Mode</CardTitle>
        </div>
        <CardDescription>
          Test how automation behaves on different dates without affecting production data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Test Mode allows you to simulate automation runs on any date. Use "Dry Run" to see what would happen without making actual changes.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-date">Test Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !testDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {testDate ? format(testDate, "PPP") : <span>Pick a test date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={testDate}
                  onSelect={setTestDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-sm text-muted-foreground">
              Select a date to simulate automation behavior
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="dry-run">Dry Run Mode</Label>
              <p className="text-sm text-muted-foreground">
                Preview changes without modifying data
              </p>
            </div>
            <Switch
              id="dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
          </div>

          {!dryRun && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Dry Run is OFF. This will create actual records and modify data!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid gap-3">
          <Button
            onClick={runComplianceAutomation}
            disabled={isRunning || !testDate}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? "Running..." : "Test Compliance Automation"}
          </Button>

          <Button
            onClick={runLeaveAutomation}
            disabled={isRunning || !testDate}
            variant="outline"
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? "Running..." : "Test Leave Automation"}
          </Button>

          <Button
            onClick={runNotifications}
            disabled={isRunning || !testDate}
            variant="outline"
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? "Running..." : "Test Notifications"}
          </Button>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Results:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}