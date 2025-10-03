import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ProfileDropdown } from "./ProfileDropdown";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Premium Top Header */}
          <header className="sticky top-0 z-40 backdrop-blur-xl bg-card/60 border-b border-border/40 shadow-sm">
            <div className="flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden hover:scale-110 transition-transform duration-200" />
              </div>

              <div className="flex items-center gap-3">
                {/* Notifications with animation */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative hover:scale-110 transition-all duration-200 hover:bg-primary/10 rounded-xl group"
                >
                  <Bell className="w-5 h-5 transition-all duration-300" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-destructive to-destructive-foreground rounded-full animate-pulse shadow-lg shadow-destructive/50"></span>
                </Button>

                {/* Profile */}
                <ProfileDropdown />
              </div>
            </div>
          </header>

          {/* Main Content with enhanced styling */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}