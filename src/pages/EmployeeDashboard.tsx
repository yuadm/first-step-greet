import { useEffect, useState } from 'react';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, User, LogOut, Clock, CheckCircle, XCircle, Shield } from 'lucide-react';
import { LeaveRequestDialog } from '@/components/employee/LeaveRequestDialog';
import { DocumentUploadDialog } from '@/components/employee/DocumentUploadDialog';
import { ComplianceOverview } from '@/components/employee/ComplianceOverview';
import { CompanyProvider, useCompany } from '@/contexts/CompanyContext';
import { useEmployeeLeaves } from '@/hooks/queries/useEmployeeDashboardQueries';
function EmployeeDashboardContent() {
  const {
    employee,
    loading,
    signOut
  } = useEmployeeAuth();
  const {
    companySettings
  } = useCompany();
  const navigate = useNavigate();
  
  // Use React Query hooks for data fetching with auto-sync
  const { 
    data: leaveRequests = [], 
    isLoading: leavesLoading, 
    refetch: refetchLeaves 
  } = useEmployeeLeaves(employee?.id || '');
  
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  useEffect(() => {
    if (!loading && !employee) {
      navigate('/employee-login');
      return;
    }
  }, [employee, loading, navigate]);
  const handleSignOut = async () => {
    await signOut();
    navigate('/employee-login');
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };
  if (loading || leavesLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>;
  }
  if (!employee) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Employee Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">Please contact your administrator to set up your employee profile.</p>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Modern Header */}
      <header className="backdrop-blur-md bg-white/80 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Company Info */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                {companySettings.logo ? <div className="relative">
                    <img src={companySettings.logo} alt={companySettings.name} className="h-12 w-12 object-contain rounded-xl shadow-sm" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
                  </div> : <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                    <Shield className="h-7 w-7 text-white" />
                  </div>}
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {companySettings.name}
                  </h1>
                  {companySettings.tagline && <p className="text-sm text-gray-600">{companySettings.tagline}</p>}
                </div>
              </div>
              <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
              <div className="hidden lg:block">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-lg font-semibold text-gray-900">Welcome back!</span>
                </div>
                
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/employee-statements')} className="hidden sm:flex items-center gap-2 hover:bg-primary/5 hover:border-primary/20">
                <FileText className="w-4 h-4" />
                Statements
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="hover:bg-red-50 hover:border-red-200 hover:text-red-700">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Dashboard Overview</h2>
                <p className="text-white/90 text-lg">Track your progress and stay compliant</p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  
                  
                </div>
                <div className="text-right">
                  
                  
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Total Allowance</p>
                  <p className="text-3xl font-bold text-gray-900">{employee.leave_allowance}</p>
                  <p className="text-xs text-gray-500 mt-1">Days per year</p>
                </div>
                <div className="relative">
                  <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 animate-fade-in" style={{
          animationDelay: '0.1s'
        }}>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/5" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-1">Days Taken</p>
                  <p className="text-3xl font-bold text-gray-900">{employee.leave_taken}</p>
                  <p className="text-xs text-gray-500 mt-1">This year</p>
                </div>
                <div className="relative">
                  <div className="h-14 w-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 animate-fade-in" style={{
          animationDelay: '0.2s'
        }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/5" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Remaining</p>
                  <p className="text-3xl font-bold text-gray-900">{employee.remaining_leave_days}</p>
                  <p className="text-xs text-gray-500 mt-1">Days available</p>
                </div>
                <div className="relative">
                  <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Personal Information */}
          <Card className="hover:shadow-lg transition-all duration-300 animate-fade-in" style={{
          animationDelay: '0.3s'
        }}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {[{
                  label: 'Full Name',
                  value: employee.name,
                  icon: User
                }, {
                  label: 'Email Address',
                  value: employee.email,
                  icon: FileText
                }, {
                  label: 'Branch Location',
                  value: employee.branch,
                  icon: Calendar
                }, {
                  label: 'Job Title',
                  value: employee.job_title || 'Not specified',
                  icon: CheckCircle
                }].map((item, index) => <div key={item.label} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">{item.label}</p>
                        <p className="font-medium text-gray-900">{item.value}</p>
                      </div>
                    </div>)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Compliance Overview */}
          <div className="animate-fade-in" style={{
          animationDelay: '0.4s'
        }}>
            <ComplianceOverview employeeId={employee.id} />
          </div>
        </div>

        {/* Enhanced Leave Management */}
        <Card className="hover:shadow-lg transition-all duration-300 animate-fade-in" style={{
        animationDelay: '0.5s'
      }}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                Leave Management
              </CardTitle>
              <div className="flex gap-3">
                <Button onClick={() => setShowLeaveDialog(true)} className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200">
                  <Calendar className="w-4 h-4 mr-2" />
                  Request Leave
                </Button>
                <Button variant="outline" onClick={() => setShowDocumentDialog(true)} className="hover:bg-primary/5 hover:border-primary/20">
                  <FileText className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveRequests.length === 0 ? <div className="text-center py-12">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-2">No leave requests found</p>
                  <p className="text-sm text-gray-400">Your leave requests will appear here</p>
                </div> : leaveRequests.map((leave, index) => <div key={leave.id} className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-primary/20 hover:shadow-md transition-all duration-200" style={{
              animationDelay: `${0.1 * index}s`
            }}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                        {getStatusIcon(leave.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900">{leave.leave_type.name}</span>
                          <Badge variant={getStatusColor(leave.status)} className="flex items-center gap-1 px-3 py-1">
                            {getStatusIcon(leave.status)}
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                          <span>{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Duration: {Math.ceil((new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} days</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          This leave was applied on {new Date(leave.created_at).toLocaleDateString()}
                        </div>
                        {leave.notes && <p className="text-sm text-gray-500 mt-2 italic">{leave.notes}</p>}
                      </div>
                    </div>
                  </div>)}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <LeaveRequestDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog} employeeId={employee.id} onSuccess={refetchLeaves} />
      
      <DocumentUploadDialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog} employeeId={employee.id} />
    </div>;
}
export default function EmployeeDashboard() {
  return <CompanyProvider>
      <EmployeeDashboardContent />
    </CompanyProvider>;
}