import { useEffect } from 'react';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, FileText } from 'lucide-react';
import { CompanyProvider, useCompany } from '@/contexts/CompanyContext';
import { EmployeeHeroSection } from './EmployeeHeroSection';
import { LeaveManagementCard } from './LeaveManagementCard';
import { StatementsCard } from './StatementsCard';
import { PersonalInfoCard } from './PersonalInfoCard';
import { ComplianceOverview } from '@/components/employee/ComplianceOverview';

function ModernEmployeeDashboardContent() {
  const { employee, loading, signOut } = useEmployeeAuth();
  const { companySettings } = useCompany();
  const navigate = useNavigate();

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 bg-primary rounded-full animate-spin mx-auto" />
          <div className="text-lg font-medium">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-semibold">Employee Profile Not Found</h2>
          <p className="text-muted-foreground">Please contact your administrator to set up your employee profile.</p>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Modern Floating Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Company Brand */}
            <div className="flex items-center gap-4">
              {companySettings.logo ? (
                <img
                  src={companySettings.logo}
                  alt={companySettings.name}
                  className="h-10 w-10 object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-primary-foreground font-bold text-sm">
                    {companySettings.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold">{companySettings.name}</h1>
                {companySettings.tagline && (
                  <p className="text-xs text-muted-foreground">{companySettings.tagline}</p>
                )}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="hover:bg-destructive/10 hover:border-destructive/20 hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <EmployeeHeroSection />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <PersonalInfoCard />
            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <ComplianceOverview employeeId={employee.id} />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <LeaveManagementCard employeeId={employee.id} />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <StatementsCard employeeId={employee.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function ModernEmployeeDashboard() {
  return (
    <CompanyProvider>
      <ModernEmployeeDashboardContent />
    </CompanyProvider>
  );
}