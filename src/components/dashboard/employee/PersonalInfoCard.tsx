import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Shield, Calendar, Briefcase, MapPin } from "lucide-react";
import { useEmployeeAuth } from "@/contexts/EmployeeAuthContext";

export function PersonalInfoCard() {
  const { employee } = useEmployeeAuth();

  if (!employee) return null;

  const infoItems = [
    { 
      label: 'Full Name', 
      value: employee.name, 
      icon: User,
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      label: 'Email Address', 
      value: employee.email, 
      icon: Mail,
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      label: 'Employee Code', 
      value: employee.employee_code, 
      icon: Shield,
      gradient: 'from-green-500 to-emerald-500'
    },
    { 
      label: 'Branch Location', 
      value: employee.branch, 
      icon: MapPin,
      gradient: 'from-orange-500 to-red-500'
    },
    { 
      label: 'Job Title', 
      value: employee.job_title || 'Not specified', 
      icon: Briefcase,
      gradient: 'from-indigo-500 to-purple-500'
    },
    { 
      label: 'Employment Type', 
      value: employee.employee_type, 
      icon: Calendar,
      gradient: 'from-teal-500 to-blue-500'
    }
  ];

  return (
    <Card className="card-premium animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          Personal Information
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid gap-4">
          {infoItems.map((item, index) => (
            <div 
              key={item.label} 
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-all animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`h-10 w-10 bg-gradient-to-br ${item.gradient} rounded-lg flex items-center justify-center shadow-md`}>
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className="font-medium">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}