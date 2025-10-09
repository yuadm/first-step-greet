import { LogOut, Settings, User, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SidebarUserMenuProps {
  collapsed: boolean;
}

export function SidebarUserMenu({ collapsed }: SidebarUserMenuProps) {
  const { user, userRole, signOut } = useAuth();

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full h-12 p-0 relative group",
              "hover:bg-white/10 rounded-xl transition-all duration-300"
            )}
          >
            {/* Avatar with Status Ring */}
            <div className="relative mx-auto">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all duration-300">
                <span className="text-sm font-bold text-white">{userInitial}</span>
              </div>
              {/* Online Status Indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar animate-pulse" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="end"
          className="w-56 bg-popover/95 backdrop-blur-xl border-white/10"
        >
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user?.email || "Unknown User"}</p>
              <p className="text-xs text-muted-foreground capitalize">{userRole || "user"}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <HelpCircle className="mr-2 h-4 w-4" />
            Help
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-y-2">
      {/* User Info Card */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 group cursor-pointer">
        {/* Avatar with Status Ring */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all duration-300">
            <span className="text-sm font-bold text-white">{userInitial}</span>
          </div>
          {/* Online Status Indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar animate-pulse" />
        </div>

        {/* User Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {user?.email || "Unknown User"}
          </p>
          <p className="text-xs text-muted-foreground capitalize truncate">
            {userRole || "user"}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg transition-all duration-300"
        >
          <Settings className="w-4 h-4" />
          <span className="text-xs">Settings</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="justify-center gap-2 bg-white/5 hover:bg-destructive/20 border border-white/5 hover:border-destructive/30 text-destructive rounded-lg transition-all duration-300"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-xs">Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
