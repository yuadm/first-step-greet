import { useTestMode } from '@/contexts/TestModeContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { formatTestDate } from '@/lib/test-mode-utils';

export function TestModeBanner() {
  const { isTestMode, simulatedDate } = useTestMode();

  if (!isTestMode) return null;

  return (
    <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950 mb-4">
      <AlertTriangle className="h-5 w-5 text-orange-600" />
      <AlertDescription className="text-orange-800 dark:text-orange-200 font-semibold">
        ⚠️ TEST MODE ACTIVE - Simulated Date: {formatTestDate(simulatedDate)}
      </AlertDescription>
    </Alert>
  );
}
