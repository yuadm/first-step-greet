import { Settings, Sparkles, TrendingUp, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

export function SettingsHero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-b">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative px-8 py-12">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-primary rounded-xl shadow-glow">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary-hover to-primary bg-clip-text text-transparent">
                  Settings Hub
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Configure and customize your HR platform
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-glow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-soft rounded-lg">
                  <Shield className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">100%</p>
                  <p className="text-xs text-muted-foreground">Config Health</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-glow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-soft rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">Active</p>
                  <p className="text-xs text-muted-foreground">All Systems</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
