import { useEffect, useState } from 'react';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Briefcase,
  Building2,
  Clock,
  TrendingUp,
  Shield,
  Users,
  ChevronRight,
  Activity,
  Star,
  Menu,
  FileText,
  LogOut,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ComplianceOverview } from '@/components/employee/ComplianceOverview';
import { EmployeeStatementsSection } from '@/components/employee/EmployeeStatementsSection';
import { LeaveRequestDialog } from '@/components/employee/LeaveRequestDialog';
import { DocumentUploadDialog } from '@/components/employee/DocumentUploadDialog';
import { CompanyProvider, useCompany } from '@/contexts/CompanyContext';

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  notes: string;
  leave_type: { name: string };
  created_at: string;
}

function EmployeeDashboardContent() {
  const { employee, loading, signOut } = useEmployeeAuth();
  const { companySettings } = useCompany();
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!loading && !employee) {
      navigate('/employee-login');
      return;
    }
    if (employee) {
      fetchLeaveRequests();
    }
  }, [employee, loading, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchLeaveRequests = async () => {
    if (!employee) return;
    
    try {
      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_requests')
        .select(`
          *,
          leave_type:leave_types(name)
        `)
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (leaveError) throw leaveError;
      setLeaveRequests(leaveData || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/employee-login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-muted rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Employee Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">Please contact your administrator to set up your employee profile.</p>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>
    );
  }

  // Mock data for demonstration
  const stats = [
    { 
      label: 'Leave Allowance', 
      value: employee.leave_allowance?.toString() || '0', 
      icon: Activity, 
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50/80 to-red-50/60',
      borderColor: 'border-orange-200'
    },
    { 
      label: 'Days Taken', 
      value: employee.leave_taken?.toString() || '0', 
      icon: TrendingUp, 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50/80 to-emerald-50/60',
      borderColor: 'border-green-200'
    },
    { 
      label: 'Remaining Days', 
      value: employee.remaining_leave_days?.toString() || '0', 
      icon: Users, 
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'from-blue-50/80 to-indigo-50/60',
      borderColor: 'border-blue-200'
    },
    { 
      label: 'Performance', 
      value: '95%', 
      icon: Star, 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50/80 to-pink-50/60',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-First Header Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30"></div>
        
        {/* Animated background elements - hidden on mobile for performance */}
        <div className="hidden md:block absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white/5 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-32 right-1/3 w-24 h-24 bg-white/5 rounded-full animate-bounce delay-500"></div>
        </div>

        {/* Header Navigation */}
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-4 border-b border-white/20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              {companySettings.logo ? (
                <img
                  src={companySettings.logo}
                  alt={companySettings.name}
                  className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-lg"
                />
              ) : (
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  {companySettings.name}
                </h1>
                {companySettings.tagline && (
                  <p className="text-xs sm:text-sm text-white/80 hidden sm:block">{companySettings.tagline}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/employee-statements')}
                className="hidden sm:flex items-center gap-2 text-white hover:bg-white/10"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden lg:inline">Statements</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSignOut}
                className="text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                  <User className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-4xl font-bold text-white mb-1">
                    Welcome back, {employee.name?.split(' ')[0]}!
                  </h2>
                  <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Ready to make a difference today</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-white/90 text-xs sm:text-sm font-medium">{formatDate(currentTime)}</p>
                <p className="text-white text-lg sm:text-xl lg:text-2xl font-bold font-mono tracking-wider">{formatTime(currentTime)}</p>
              </div>
            </div>

            {/* Mobile-First Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              {stats.map((stat, index) => (
                <div 
                  key={stat.label}
                  className="group p-3 sm:p-4 lg:p-6 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3">
                    <div className={`h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-gradient-to-br ${stat.color} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200 mb-2 sm:mb-0`}>
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <ChevronRight className="hidden sm:block w-4 h-4 lg:w-5 lg:h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-lg sm:text-xl lg:text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile-First Layout */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Stack, Desktop Grid */}
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-8">
            
            {/* Personal Info & Quick Actions - Full width on mobile, 4 cols on desktop */}
            <div className="lg:col-span-4 space-y-6">
              {/* Personal Information Card */}
              <Card className="hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-200 bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/60 rounded-lg sm:rounded-xl">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{employee.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Full Name</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-green-50/80 to-emerald-50/60 rounded-lg sm:rounded-xl">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{employee.email}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Email Address</p>
                      </div>
                    </div>
                    
                    {employee.employee_code && (
                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-blue-50/80 to-cyan-50/60 rounded-lg sm:rounded-xl">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">{employee.employee_code}</p>
                          <p className="text-xs sm:text-sm text-gray-600">Employee ID</p>
                        </div>
                      </div>
                    )}
                    
                    {employee.job_title && (
                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-purple-50/80 to-pink-50/60 rounded-lg sm:rounded-xl">
                        <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{employee.job_title}</p>
                          <p className="text-xs sm:text-sm text-gray-600">Position</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-orange-50/80 to-red-50/60 rounded-lg sm:rounded-xl">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">
                          {employee.branch}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">Branch</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Employee Status</span>
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs">
                        <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500 rounded-full mr-1 sm:mr-2" />
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <Button 
                    onClick={() => setShowLeaveDialog(true)}
                    className="w-full justify-start bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-10 sm:h-12 text-sm sm:text-base"
                  >
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                    Request Leave
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDocumentDialog(true)}
                    className="w-full justify-start hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:border-green-200 transition-all duration-300 h-10 sm:h-12 text-sm sm:text-base"
                  >
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                    Upload Document
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-200 transition-all duration-300 h-10 sm:h-12 text-sm sm:text-base"
                  >
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                    View Schedule
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Compliance & Statements - Full width on mobile, 8 cols on desktop */}
            <div className="lg:col-span-8 space-y-6">
              {/* Compliance Overview - Full width on mobile, split on desktop */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-6 lg:space-y-0">
                <ComplianceOverview employeeId={employee.id} />
                
                {/* Leave Management Card */}
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      Recent Leave Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {leaveRequests.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leave Requests</h3>
                        <p className="text-gray-500 text-sm">Your leave requests will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {leaveRequests.slice(0, 3).map((leave, index) => (
                          <div 
                            key={leave.id}
                            className="p-3 border-2 border-gray-100 rounded-xl hover:border-teal-200 transition-all duration-300"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                {getStatusIcon(leave.status)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-900 text-sm truncate">{leave.leave_type.name}</span>
                                  <Badge variant={getStatusColor(leave.status)} className="text-xs px-2 py-0.5">
                                    {leave.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600">
                                  {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Statements Section - Full width */}
              <EmployeeStatementsSection limit={5} />
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <LeaveRequestDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        employeeId={employee.id}
        onSuccess={fetchLeaveRequests}
      />
      
      <DocumentUploadDialog
        open={showDocumentDialog}
        onOpenChange={setShowDocumentDialog}
        employeeId={employee.id}
      />
    </div>
  );
}

export default function EmployeeDashboard() {
  return (
    <CompanyProvider>
      <EmployeeDashboardContent />
    </CompanyProvider>
  );
}