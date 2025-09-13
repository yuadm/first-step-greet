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
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          Compliance Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Due Items */}
        {dueItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 bg-orange-500 rounded-full" />
              <h4 className="font-semibold text-gray-900">
                Action Required ({dueItems.length})
              </h4>
            </div>
            <div className="space-y-3">
              {dueItems.map((item, index) => (
                <div 
                  key={`${item.id}-${item.period}`} 
                  className="group p-4 border-2 border-orange-100 bg-orange-50/50 rounded-xl hover:border-orange-200 transition-all duration-200"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      {getStatusIcon(item.status, item.isOverdue)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-900">{item.name}</span>
                        <Badge variant={getStatusVariant(item.status, item.isOverdue)} className="flex items-center gap-1 px-3 py-1">
                          {item.isOverdue ? 'Overdue' : 'Due Soon'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatPeriod(item.period)} • {formatFrequency(item.frequency)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <h4 className="font-semibold text-gray-900">
                Recently Completed ({completedItems.length})
              </h4>
            </div>
            <div className="space-y-3">
              {completedItems.map((item, index) => (
                <div 
                  key={`${item.id}-${item.period}`} 
                  className="group p-4 border-2 border-green-100 bg-green-50/50 rounded-xl hover:border-green-200 transition-all duration-200"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-900">{item.name}</span>
                        <Badge variant="default" className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatPeriod(item.period)} • {formatFrequency(item.frequency)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Up to Date */}
        {dueItems.length === 0 && completedItems.length === 0 && (
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-500">No pending compliance items at this time</p>
          </div>
        )}

        {/* Quick Actions */}
        {(dueItems.length > 0 || completedItems.length > 0) && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {dueItems.length > 0 ? `${dueItems.length} items need attention` : 'All items up to date'}
              </span>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${dueItems.length > 0 ? 'bg-orange-500' : 'bg-green-500'}`} />
                <span className={`font-medium ${dueItems.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {dueItems.length > 0 ? 'Action Required' : 'Compliant'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}