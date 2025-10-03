
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
  ChevronLeft,
  ChevronRight,
  LogOut,
  Briefcase,
  FileSignature,
  Sparkles,
  Bell,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { usePermissions } from "@/contexts/PermissionsContext";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    description: "Overview & Analytics",
    requiredPage: "/"
  },
  {
    title: "Employees",
    url: "/employees",
    icon: Users,
    description: "Manage Staff",
    requiredPage: "/employees"
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Building2,
    description: "Manage Clients",
    requiredPage: "/clients"
  },
  {
    title: "Leaves",
    url: "/leaves",
    icon: Calendar,
    description: "Time Off Management",
    requiredPage: "/leaves"
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
    description: "Document Tracking",
    requiredPage: "/documents"
  },
  {
    title: "Document Signing",
    url: "/document-signing",
    icon: FileSignature,
    description: "Digital Signatures",
    requiredPage: "/document-signing"
  },
  {
    title: "Compliance",
    url: "/compliance",
    icon: Shield,
    description: "Regulatory Tasks",
    requiredPage: "/compliance"
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    description: "Analytics & Export",
    requiredPage: "/reports"
  },
  {
    title: "Job Applications",
    url: "/job-applications",
    icon: Briefcase,
    description: "Review Applications",
    requiredPage: "/job-applications"
  },
];

const settingsItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "System Configuration",
    requiredPage: "/settings"
  },
  {
    title: "User Management",
    url: "/user-management",
    icon: UserCog,
    description: "Roles & Permissions",
    requiredPage: "/user-management"
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { companySettings } = useCompany();
  const { user, userRole, signOut } = useAuth();
  const { hasPageAccess, loading: permissionsLoading, error } = usePermissions();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    const active = isActive(path);
    return cn(
      "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
      "backdrop-blur-sm",
      active
        ? "bg-gradient-to-r from-primary to-primary-hover text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:scale-[1.01] hover:shadow-md",
      "before:absolute before:inset-0 before:rounded-xl before:transition-opacity before:duration-300",
      active 
        ? "before:bg-gradient-to-r before:from-primary/10 before:to-transparent before:opacity-100"
        : "before:opacity-0 hover:before:opacity-100 hover:before:bg-gradient-to-r hover:before:from-primary/5 hover:before:to-transparent"
    );
  };

  // Filter navigation items based on permissions (only when not loading)
  const accessibleNavigationItems = permissionsLoading 
    ? [] 
    : navigationItems.filter(item => hasPageAccess(item.requiredPage));

  const accessibleSettingsItems = permissionsLoading 
    ? [] 
    : settingsItems.filter(item => hasPageAccess(item.requiredPage));

  return (
    <Sidebar
      className={cn(
        "border-r border-sidebar-border transition-all duration-300",
        "bg-gradient-to-b from-sidebar-background via-sidebar-background to-sidebar-background/95",
        "backdrop-blur-xl",
        collapsed ? "w-16" : "w-72"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="relative px-4 py-5 border-b border-sidebar-border/50">
        {/* Premium header with glassmorphism */}
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3 animate-fade-in">
              {/* Logo with glow effect */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-hover rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center overflow-hidden shadow-lg">
                  {companySettings.logo ? (
                    <img
                      src={companySettings.logo}
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Sparkles className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
              
              {/* Company info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">
                  {companySettings.name}
                </h1>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {companySettings.tagline || "HR Management"}
                </p>
              </div>
            </div>
          )}
          
          {/* Toggle button with animation */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "w-9 h-9 p-0 rounded-lg transition-all duration-300",
              "hover:bg-sidebar-accent hover:scale-110 hover:shadow-md",
              "active:scale-95",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 transition-transform duration-300" />
            ) : (
              <ChevronLeft className="w-4 h-4 transition-transform duration-300" />
            )}
          </Button>
        </div>

        {/* Quick actions bar (collapsed state) */}
        {collapsed && (
          <div className="mt-4 flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {permissionsLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-sidebar-accent rounded w-20"></div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-sidebar-accent rounded"></div>
              ))}
            </div>
            <div className="animate-pulse space-y-2 mt-8">
              <div className="h-4 bg-sidebar-accent rounded w-24"></div>
              {[1, 2].map((i) => (
                <div key={i} className="h-10 bg-sidebar-accent rounded"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <div className="text-destructive text-sm mb-2">Failed to load permissions</div>
            <div className="text-xs text-muted-foreground">Please refresh the page</div>
          </div>
        ) : (
          <>
            <SidebarGroup>
              {!collapsed && (
                <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-bold mb-3 px-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-gradient-to-b from-primary to-primary-hover rounded-full"></span>
                  Workspace
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1.5">
                  {accessibleNavigationItems.map((item, index) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                        <NavLink 
                          to={item.url} 
                          className={getNavClassName(item.url)}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="relative z-10 flex items-center gap-3 w-full">
                            <item.icon className={cn(
                              "w-5 h-5 flex-shrink-0 transition-all duration-300",
                              isActive(item.url) 
                                ? "scale-110" 
                                : "group-hover:scale-110 group-hover:rotate-3"
                            )} />
                            {!collapsed && (
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm">{item.title}</div>
                                <div className="text-xs opacity-70 truncate">
                                  {item.description}
                                </div>
                              </div>
                            )}
                          </div>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {accessibleSettingsItems.length > 0 && (
              <SidebarGroup className="mt-6">
                {!collapsed && (
                  <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-bold mb-3 px-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-accent to-accent-hover rounded-full"></span>
                    Administration
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1.5">
                    {accessibleSettingsItems.map((item, index) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                          <NavLink 
                            to={item.url} 
                            className={getNavClassName(item.url)}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="relative z-10 flex items-center gap-3 w-full">
                              <item.icon className={cn(
                                "w-5 h-5 flex-shrink-0 transition-all duration-300",
                                isActive(item.url) 
                                  ? "scale-110" 
                                  : "group-hover:scale-110 group-hover:rotate-3"
                              )} />
                              {!collapsed && (
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm">{item.title}</div>
                                  <div className="text-xs opacity-70 truncate">
                                    {item.description}
                                  </div>
                                </div>
                              )}
                            </div>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 px-3 py-4 space-y-3">
        {!collapsed ? (
          <>
            {/* Premium user profile card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl blur-sm group-hover:blur-md transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative flex items-center gap-3 px-3 py-3 rounded-xl bg-sidebar-accent/50 backdrop-blur-sm border border-sidebar-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-md">
                {/* Avatar with status indicator */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary-hover to-accent flex items-center justify-center shadow-lg ring-2 ring-sidebar-background">
                    <span className="text-sm font-bold text-white">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-sidebar-background"></div>
                </div>
                
                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-sidebar-foreground truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
                      {userRole || 'user'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sign out button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start gap-3 px-3 py-2.5 text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 group"
            >
              <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-12" />
              <span className="font-medium">Sign Out</span>
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            {/* Collapsed avatar */}
            <div className="relative mx-auto w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full blur-sm opacity-60"></div>
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary-hover to-accent flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-sidebar-background"></div>
            </div>
            
            {/* Collapsed sign out */}
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-10 h-10 mx-auto p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-300 hover:scale-110 active:scale-95 group"
            >
              <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-12" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
