import { Badge } from "@/components/ui/badge";
import { useEmployeeAuth } from "@/contexts/EmployeeAuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Calendar, Clock, CheckCircle, Shield, Sparkles } from "lucide-react";

export function EmployeeHeroSection() {
  const { employee } = useEmployeeAuth();
  const { companySettings } = useCompany();

  if (!employee) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-lg">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <Sparkles className="h-8 w-8 animate-pulse" />
      </div>
      <div className="absolute bottom-4 left-4 opacity-20">
        <Shield className="h-6 w-6 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-primary-foreground rounded-full animate-pulse" />
              <span className="text-sm font-medium opacity-90">Welcome back</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              {employee.name}
            </h1>
            <p className="text-lg opacity-90">
              {employee.job_title || 'Team Member'} • {employee.branch}
            </p>
          </div>
          
          <div className="text-right space-y-2">
            <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-white/30">
              {employee.employee_code}
            </Badge>
            <div className="text-sm opacity-90">
              {employee.employee_type}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{employee.leave_allowance}</p>
                <p className="text-sm opacity-80">Total Allowance</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{employee.leave_taken}</p>
                <p className="text-sm opacity-80">Days Taken</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{employee.remaining_leave_days}</p>
                <p className="text-sm opacity-80">Remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}