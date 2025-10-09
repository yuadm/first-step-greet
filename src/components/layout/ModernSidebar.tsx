import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Shield,
  Settings,
  UserCog,
  BarChart3,
  Building2,
  Briefcase,
  FileSignature,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/contexts/CompanyContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { cn } from "@/lib/utils";
import { SidebarNavCard } from "./SidebarNavCard";
import { SidebarQuickActions } from "./SidebarQuickActions";
import { SidebarUserMenu } from "./SidebarUserMenu";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    description: "Overview & Analytics",
    requiredPage: "/",
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Employees",
    url: "/employees",
    icon: Users,
    description: "Manage Staff",
    requiredPage: "/employees",
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Building2,
    description: "Manage Clients",
    requiredPage: "/clients",
    color: "from-green-500 to-emerald-500"
  },
  {
    title: "Leaves",
    url: "/leaves",
    icon: Calendar,
    description: "Time Off Management",
    requiredPage: "/leaves",
    color: "from-orange-500 to-red-500"
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
    description: "Document Tracking",
    requiredPage: "/documents",
    color: "from-yellow-500 to-amber-500"
  },
  {
    title: "Document Signing",
    url: "/document-signing",
    icon: FileSignature,
    description: "Digital Signatures",
    requiredPage: "/document-signing",
    color: "from-indigo-500 to-blue-500"
  },
  {
    title: "Compliance",
    url: "/compliance",
    icon: Shield,
    description: "Regulatory Tasks",
    requiredPage: "/compliance",
    color: "from-red-500 to-pink-500"
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    description: "Analytics & Export",
    requiredPage: "/reports",
    color: "from-teal-500 to-cyan-500"
  },
  {
    title: "Job Applications",
    url: "/job-applications",
    icon: Briefcase,
    description: "Review Applications",
    requiredPage: "/job-applications",
    color: "from-violet-500 to-purple-500"
  },
];

const settingsItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "System Configuration",
    requiredPage: "/settings",
    color: "from-gray-500 to-slate-500"
  },
  {
    title: "User Management",
    url: "/user-management",
    icon: UserCog,
    description: "Roles & Permissions",
    requiredPage: "/user-management",
    color: "from-blue-500 to-indigo-500"
  },
];

export function ModernSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { companySettings } = useCompany();
  const { hasPageAccess, loading: permissionsLoading } = usePermissions();
  const location = useLocation();

  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState !== null) {
      setCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const accessibleNavigationItems = permissionsLoading 
    ? [] 
    : navigationItems.filter(item => hasPageAccess(item.requiredPage));

  const accessibleSettingsItems = permissionsLoading 
    ? [] 
    : settingsItems.filter(item => hasPageAccess(item.requiredPage));

  return (
    <aside
      className={cn(
        "relative flex-shrink-0 transition-all duration-500 ease-out",
        collapsed ? "w-[100px]" : "w-[300px]"
      )}
      onMouseMove={handleMouseMove}
    >
      {/* Floating Glassmorphic Container */}
      <div
        className={cn(
          "fixed top-4 bottom-4 left-4 z-50",
          "bg-sidebar/40 backdrop-blur-2xl",
          "border border-white/10 rounded-3xl",
          "shadow-2xl shadow-primary/5",
          "flex flex-col overflow-hidden",
          "transition-all duration-500 ease-out",
          collapsed ? "w-[84px]" : "w-[284px]"
        )}
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(var(--primary-rgb), 0.05) 0%, transparent 50%)`,
        }}
      >
        {/* Animated Border Glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-primary/10 opacity-50 pointer-events-none" />

        {/* Header */}
        <div className="relative px-4 py-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-3 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30 ring-2 ring-primary/20">
                  {companySettings.logo ? (
                    <img
                      src={companySettings.logo}
                      alt="Logo"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <Shield className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-base font-bold text-foreground">
                    {companySettings.name}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {companySettings.tagline}
                  </p>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30 ring-2 ring-primary/20 animate-fade-in">
                {companySettings.logo ? (
                  <img
                    src={companySettings.logo}
                    alt="Logo"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <Shield className="w-6 h-6 text-white" />
                )}
              </div>
            )}
          </div>
          
          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "absolute -right-3 top-8 w-6 h-6 rounded-full",
              "bg-card border border-border shadow-lg",
              "hover:bg-accent hover:scale-110",
              "transition-all duration-300"
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
          </Button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6 custom-scrollbar">
          {permissionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-white/5 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {/* Main Navigation */}
              <div className="space-y-2">
                {!collapsed && (
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">
                    Main Menu
                  </h2>
                )}
                <div className={cn(
                  "grid gap-2",
                  collapsed ? "grid-cols-1" : "grid-cols-1"
                )}>
                  {accessibleNavigationItems.map((item, index) => (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <SidebarNavCard
                        icon={item.icon}
                        title={item.title}
                        description={item.description}
                        isActive={isActive(item.url)}
                        collapsed={collapsed}
                        gradientColor={item.color}
                      />
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Settings Navigation */}
              {accessibleSettingsItems.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-white/5">
                  {!collapsed && (
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">
                      Administration
                    </h2>
                  )}
                  <div className={cn(
                    "grid gap-2",
                    collapsed ? "grid-cols-1" : "grid-cols-1"
                  )}>
                    {accessibleSettingsItems.map((item, index) => (
                      <NavLink
                        key={item.url}
                        to={item.url}
                        style={{
                          animationDelay: `${(accessibleNavigationItems.length + index) * 50}ms`
                        }}
                      >
                        <SidebarNavCard
                          icon={item.icon}
                          title={item.title}
                          description={item.description}
                          isActive={isActive(item.url)}
                          collapsed={collapsed}
                          gradientColor={item.color}
                        />
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {!collapsed && <SidebarQuickActions />}
            </>
          )}
        </div>

        {/* User Menu Footer */}
        <div className="border-t border-white/5 p-3">
          <SidebarUserMenu collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}
