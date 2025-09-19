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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
            <div className="space-y-4">
              {dueItems.map((item, index) => (
                <div 
                  key={`${item.id}-${item.period}`} 
                  className="group p-5 border-2 border-orange-100 bg-gradient-to-r from-orange-50/80 to-red-50/60 rounded-2xl hover:border-orange-200 transition-all duration-300 hover:shadow-md"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-lg">
                      {getStatusIcon(item.status, item.isOverdue)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-gray-900 text-lg">{item.name}</span>
                        <Badge variant={getStatusVariant(item.status, item.isOverdue)} className="flex items-center gap-1 px-3 py-1">
                          {item.isOverdue ? 'Overdue' : 'Due Soon'}
                        </Badge>
                      </div>
                      
                      {item.frequency === 'quarterly' && item.quarterlyTimeline ? (
                        <div className="space-y-3 mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-3">{formatFrequency(item.frequency)} Timeline</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {item.quarterlyTimeline.map((quarter, qIndex) => (
                              <div 
                                key={quarter.quarter}
                                className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
                                  quarter.status === 'completed' 
                                    ? 'border-green-200 bg-green-50/60' 
                                    : quarter.status === 'due'
                                    ? 'border-orange-200 bg-orange-50/60'
                                    : 'border-gray-200 bg-gray-50/60'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    quarter.status === 'completed' 
                                      ? 'bg-green-500 text-white' 
                                      : quarter.status === 'due'
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-gray-400 text-white'
                                  }`}>
                                    {quarter.quarter}
                                  </div>
                                  <span className="font-semibold text-sm text-gray-900">{quarter.label}</span>
                                </div>
                                <div className="mt-1 flex items-center justify-between">
                                  <Badge 
                                    variant={quarter.status === 'completed' ? 'default' : quarter.status === 'due' ? 'secondary' : 'outline'}
                                    className="text-xs px-2 py-0.5"
                                  >
                                    {quarter.status === 'completed' ? 'Completed' : quarter.status === 'due' ? 'Due' : 'Upcoming'}
                                  </Badge>
                                  {quarter.completedDate && quarter.status === 'completed' && (
                                    <span className="text-xs text-gray-500">{formatDate(quarter.completedDate)}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          {formatPeriod(item.period)} • {formatFrequency(item.frequency)}
                        </p>
                      )}
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
            <div className="space-y-4">
              {completedItems.map((item, index) => (
                <div 
                  key={`${item.id}-${item.period}`} 
                  className="group p-5 border-2 border-green-100 bg-gradient-to-r from-green-50/80 to-emerald-50/60 rounded-2xl hover:border-green-200 transition-all duration-300 hover:shadow-md"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-lg">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-gray-900 text-lg">{item.name}</span>
                        <Badge variant="default" className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </Badge>
                      </div>
                      
                      {item.frequency === 'quarterly' && item.quarterlyTimeline ? (
                        <div className="space-y-3 mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-3">{formatFrequency(item.frequency)} Timeline</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {item.quarterlyTimeline.map((quarter, qIndex) => (
                              <div 
                                key={quarter.quarter}
                                className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
                                  quarter.status === 'completed' 
                                    ? 'border-green-200 bg-green-50/60' 
                                    : quarter.status === 'due'
                                    ? 'border-orange-200 bg-orange-50/60'
                                    : 'border-gray-200 bg-gray-50/60'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    quarter.status === 'completed' 
                                      ? 'bg-green-500 text-white' 
                                      : quarter.status === 'due'
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-gray-400 text-white'
                                  }`}>
                                    {quarter.quarter}
                                  </div>
                                  <span className="font-semibold text-sm text-gray-900">{quarter.label}</span>
                                </div>
                                <div className="mt-1 flex items-center justify-between">
                                  <Badge 
                                    variant={quarter.status === 'completed' ? 'default' : quarter.status === 'due' ? 'secondary' : 'outline'}
                                    className="text-xs px-2 py-0.5"
                                  >
                                    {quarter.status === 'completed' ? 'Completed' : quarter.status === 'due' ? 'Due' : 'Upcoming'}
                                  </Badge>
                                  {quarter.completedDate && quarter.status === 'completed' && (
                                    <span className="text-xs text-gray-500">{formatDate(quarter.completedDate)}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            {formatPeriod(item.period)} • {formatFrequency(item.frequency)}
                          </p>
                          {item.completedDate && (
                            <span className="text-xs text-gray-500">Completed {formatDate(item.completedDate)}</span>
                          )}
                        </div>
                      )}
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