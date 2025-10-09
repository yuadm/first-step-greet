import { Plus, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SidebarQuickActions() {
  return (
    <div className="space-y-2 pt-4 border-t border-white/5">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">
        Quick Actions
      </h2>

      <div className="grid gap-2">
        {/* Create New Button */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-auto p-3",
            "bg-gradient-to-r from-primary/10 to-primary/5",
            "hover:from-primary/20 hover:to-primary/10",
            "border border-primary/20 hover:border-primary/30",
            "rounded-xl transition-all duration-300",
            "group hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">Create New</p>
            <p className="text-xs text-muted-foreground">Quick add item</p>
          </div>
        </Button>

        {/* Search Button */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-auto p-3",
            "bg-white/5 hover:bg-white/10",
            "border border-white/5 hover:border-white/10",
            "rounded-xl transition-all duration-300",
            "group hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Search className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
              Search
            </p>
            <p className="text-xs text-muted-foreground">Cmd + K</p>
          </div>
        </Button>

        {/* Favorites Button */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-auto p-3",
            "bg-white/5 hover:bg-white/10",
            "border border-white/5 hover:border-white/10",
            "rounded-xl transition-all duration-300",
            "group hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Star className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
              Favorites
            </p>
            <p className="text-xs text-muted-foreground">Quick access</p>
          </div>
        </Button>
      </div>
    </div>
  );
}
