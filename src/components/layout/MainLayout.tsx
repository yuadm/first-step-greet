import { ReactNode, useEffect } from "react";
import { ModernSidebar } from "./ModernSidebar";
import { ProfileDropdown } from "./ProfileDropdown";
import { NotificationPopover } from "./NotificationPopover";
import { useNotifications } from "@/hooks/useNotifications";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { requestNotificationPermission } = useNotifications();

  useEffect(() => {
    // Request notification permission on mount
    requestNotificationPermission();
  }, []);

  return (
    <div className="min-h-screen flex w-full bg-gradient-subtle">
      <ModernSidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            {/* Notifications */}
            <NotificationPopover />

            {/* Profile */}
            <ProfileDropdown />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}