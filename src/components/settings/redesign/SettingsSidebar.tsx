import { Building2, Calendar, FileText, Shield, Briefcase, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  {
    id: "company",
    label: "Company",
    icon: Building2,
    description: "Company profile & branding",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "applications",
    label: "Applications",
    icon: Briefcase,
    description: "Job application forms",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "positions",
    label: "Job Positions",
    icon: Users,
    description: "Available positions",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "branches",
    label: "Branches",
    icon: Building2,
    description: "Manage locations",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: Shield,
    description: "Compliance settings",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    description: "Document types",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    id: "leave",
    label: "Leave",
    icon: Calendar,
    description: "Leave management",
    gradient: "from-pink-500 to-rose-500",
  },
];

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <div className="w-72 flex-shrink-0 space-y-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300",
              isActive
                ? "bg-gradient-to-r shadow-lg scale-105"
                : "bg-card hover:bg-muted/50 hover:scale-102 hover:shadow-md",
              isActive && item.gradient
            )}
          >
            {/* Gradient background for active state */}
            {isActive && (
              <div className="absolute inset-0 opacity-90 bg-gradient-to-r" style={{
                background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-hover)))`
              }} />
            )}

            {/* Content */}
            <div className="relative flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg transition-all duration-300",
                isActive
                  ? "bg-white/20 backdrop-blur-sm"
                  : "bg-muted group-hover:bg-muted-hover"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-colors duration-300",
                  isActive ? "text-white" : "text-primary"
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-semibold text-sm transition-colors duration-300",
                  isActive ? "text-white" : "text-foreground"
                )}>
                  {item.label}
                </h3>
                <p className={cn(
                  "text-xs mt-0.5 transition-colors duration-300",
                  isActive ? "text-white/80" : "text-muted-foreground"
                )}>
                  {item.description}
                </p>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              )}
            </div>

            {/* Hover glow effect */}
            {!isActive && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl" />
            )}
          </button>
        );
      })}
    </div>
  );
}
