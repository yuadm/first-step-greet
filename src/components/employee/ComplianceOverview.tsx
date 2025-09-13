import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { useEmployeeCompliance } from '@/hooks/useEmployeeCompliance';

interface ComplianceOverviewProps {
  employeeId: string;
}

export function ComplianceOverview({ employeeId }: ComplianceOverviewProps) {
  const { dueItems, completedItems, loading, error } = useEmployeeCompliance(employeeId);

  const getStatusIcon = (status: string, isOverdue?: boolean) => {
    if (isOverdue) return <AlertTriangle className="w-4 h-4" />;
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'due': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string, isOverdue?: boolean) => {
    if (isOverdue) return 'destructive';
    switch (status) {
      case 'completed': return 'default';
      case 'due': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case 'annual': return 'Annual';
      case 'quarterly': return 'Quarterly';
      case 'monthly': return 'Monthly';
      case 'bi-annual': return 'Bi-Annual';
      default: return frequency;
    }
  };

  const formatPeriod = (period: string) => {
    // Convert period identifiers to readable format
    if (period.includes('Q')) {
      return period.replace('-', ' ');
    }
    if (period.includes('H')) {
      return period.replace('H1', 'H1').replace('H2', 'H2').replace('-', ' ');
    }
    return period;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">Loading compliance status...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">Unable to load compliance data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Compliance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Due Items */}
        {dueItems.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-3">
              Due Items ({dueItems.length})
            </h4>
            <div className="space-y-2">
              {dueItems.map((item) => (
                <div key={`${item.id}-${item.period}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant={getStatusVariant(item.status, item.isOverdue)} className="flex items-center gap-1">
                        {getStatusIcon(item.status, item.isOverdue)}
                        {item.isOverdue ? 'Overdue' : 'Due'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatPeriod(item.period)} • {formatFrequency(item.frequency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-3">
              Recent Completions ({completedItems.length})
            </h4>
            <div className="space-y-2">
              {completedItems.map((item) => (
                <div key={`${item.id}-${item.period}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant={getStatusVariant(item.status)} className="flex items-center gap-1">
                        {getStatusIcon(item.status)}
                        Completed
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatPeriod(item.period)} • {formatFrequency(item.frequency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No items */}
        {dueItems.length === 0 && completedItems.length === 0 && (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No compliance items found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}