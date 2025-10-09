import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isActive: boolean;
  collapsed: boolean;
  gradientColor: string;
  count?: number;
}

export function SidebarNavCard({
  icon: Icon,
  title,
  description,
  isActive,
  collapsed,
  gradientColor,
  count,
}: SidebarNavCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl transition-all duration-300 animate-fade-in",
        "hover:scale-[1.02] active:scale-[0.98]",
        isActive
          ? "bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg shadow-primary/20"
          : "bg-white/5 hover:bg-white/10 backdrop-blur-sm"
      )}
    >
      {/* Active Border Glow */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 blur-sm -z-10 animate-pulse" />
      )}

      {/* Content */}
      <div
        className={cn(
          "relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
          isActive
            ? "border-primary/30 shadow-inner"
            : "border-transparent group-hover:border-white/10"
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 rounded-lg flex items-center justify-center transition-all duration-300",
            "group-hover:scale-110 group-hover:rotate-3",
            collapsed ? "w-10 h-10" : "w-10 h-10",
            isActive
              ? `bg-gradient-to-br ${gradientColor} shadow-lg`
              : "bg-white/10 group-hover:bg-white/20"
          )}
        >
          <Icon
            className={cn(
              "transition-all duration-300",
              collapsed ? "w-5 h-5" : "w-5 h-5",
              isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
        </div>

        {/* Text Content */}
        {!collapsed && (
          <div className="flex-1 min-w-0 animate-fade-in">
            <div className="flex items-center justify-between gap-2">
              <h3
                className={cn(
                  "font-semibold text-sm truncate transition-colors duration-300",
                  isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {title}
              </h3>
              {count !== undefined && (
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "bg-white/10 text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5 opacity-80">
              {description}
            </p>
          </div>
        )}

        {/* Hover Effect Overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
            "bg-gradient-to-r from-transparent via-white/5 to-transparent"
          )}
        />
      </div>

      {/* Tooltip for Collapsed State */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      )}
    </div>
  );
}
