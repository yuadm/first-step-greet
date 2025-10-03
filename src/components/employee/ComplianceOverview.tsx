import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, AlertTriangle, Shield, TrendingUp, FileCheck } from 'lucide-react';
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

  const totalItems = dueItems.length + completedItems.length;
  const completionRate = totalItems > 0 ? Math.round((completedItems.length / totalItems) * 100) : 100;

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="space-y-4">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="truncate">Compliance Status</span>
          </CardTitle>
          
          {/* Overall Progress */}
          {totalItems > 0 && (
            <div className="space-y-3 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-lg sm:rounded-xl border border-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 truncate">Overall Compliance</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">{completionRate}%</span>
                  <div className={`h-2 w-2 rounded-full ${completionRate === 100 ? 'bg-green-500' : completionRate >= 70 ? 'bg-orange-500' : 'bg-red-500'} animate-pulse`} />
                </div>
              </div>
              <Progress value={completionRate} className="h-2 sm:h-3" />
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                <span className="truncate">{completedItems.length} of {totalItems} completed</span>
                {dueItems.length > 0 && (
                  <span className="text-orange-600 font-medium flex-shrink-0 ml-2">{dueItems.length} pending</span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
        {/* Due Items */}
        {dueItems.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
              <h4 className="font-semibold text-sm sm:text-base text-gray-900">
                Action Required
              </h4>
              <Badge className="bg-orange-500 text-white border-0 text-xs ml-auto flex-shrink-0">
                {dueItems.length}
              </Badge>
            </div>
            
            <div className="grid gap-3 sm:gap-4">
              {dueItems.map((item, index) => (
                <div 
                  key={`${item.id}-${item.period}`} 
                  className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-orange-100 bg-gradient-to-br from-orange-50/80 via-white to-red-50/40 hover:border-orange-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500" />
                  
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-md flex-shrink-0">
                        {getStatusIcon(item.status, item.isOverdue)}
                        <div className="absolute inset-0 bg-white/20 rounded-lg sm:rounded-xl" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base text-gray-900 break-words">{item.name}</span>
                          <Badge 
                            className={`${item.isOverdue ? 'bg-red-500' : 'bg-orange-500'} text-white border-0 text-xs flex-shrink-0`}
                          >
                            {item.isOverdue ? 'Overdue' : 'Due Soon'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{formatPeriod(item.period)} • {formatFrequency(item.frequency)}</span>
                        </div>

                        {item.frequency === 'quarterly' && item.quarterlyTimeline && (
                          <div className="space-y-2 pt-2">
                            <div className="grid grid-cols-2 gap-2">
                              {item.quarterlyTimeline.map((quarter) => (
                                <div 
                                  key={quarter.quarter}
                                  className={`p-2 rounded-lg border transition-all duration-200 ${
                                    quarter.status === 'completed' 
                                      ? 'border-green-200 bg-green-50/80' 
                                      : quarter.status === 'due'
                                      ? 'border-orange-200 bg-orange-50/80'
                                      : 'border-gray-200 bg-gray-50/80'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      quarter.status === 'completed' 
                                        ? 'bg-green-500 text-white' 
                                        : quarter.status === 'due'
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-400 text-white'
                                    }`}>
                                      {quarter.quarter}
                                    </div>
                                    <span className="font-semibold text-xs truncate">{quarter.label}</span>
                                  </div>
                                  <Badge 
                                    variant={quarter.status === 'completed' ? 'default' : 'outline'}
                                    className="text-[10px] px-1.5 py-0.5 h-auto w-full justify-center"
                                  >
                                    {quarter.status === 'completed' ? '✓' : quarter.status === 'due' ? '!' : '○'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <h4 className="font-semibold text-sm sm:text-base text-gray-900">
                Recently Completed
              </h4>
              <Badge className="bg-green-500 text-white border-0 text-xs ml-auto flex-shrink-0">
                {completedItems.length}
              </Badge>
            </div>
            
            <div className="grid gap-3 sm:gap-4">
              {completedItems.slice(0, 3).map((item, index) => (
                <div 
                  key={`${item.id}-${item.period}`} 
                  className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-green-100 bg-gradient-to-br from-green-50/80 via-white to-emerald-50/40 hover:border-green-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
                  
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-md flex-shrink-0">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        <div className="absolute inset-0 bg-white/20 rounded-lg sm:rounded-xl" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base text-gray-900 break-words">{item.name}</span>
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs flex-shrink-0">
                            ✓ Done
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                          <div className="flex items-center gap-2 text-gray-600 min-w-0">
                            <FileCheck className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{formatPeriod(item.period)} • {formatFrequency(item.frequency)}</span>
                          </div>
                          {item.completedDate && (
                            <span className="text-gray-500 flex-shrink-0 hidden sm:block">{formatDate(item.completedDate)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {completedItems.length > 3 && (
              <div className="text-center pt-2">
                <p className="text-xs sm:text-sm text-gray-500">
                  +{completedItems.length - 3} more completed items
                </p>
              </div>
            )}
          </div>
        )}

        {/* All Up to Date */}
        {dueItems.length === 0 && completedItems.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-sm sm:text-base text-gray-500">No pending compliance items at this time</p>
          </div>
        )}

        {/* Summary Footer */}
        {(dueItems.length > 0 || completedItems.length > 0) && (
          <div className="pt-3 sm:pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="text-gray-600 truncate">
                {dueItems.length > 0 ? `${dueItems.length} item${dueItems.length === 1 ? '' : 's'} need attention` : 'All items up to date'}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`h-2 w-2 rounded-full ${dueItems.length > 0 ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                <span className={`font-semibold ${dueItems.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
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