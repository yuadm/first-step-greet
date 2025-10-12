import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface MinimalistHeaderProps {
  isConnected: boolean;
}

export function MinimalistHeader({ isConnected }: MinimalistHeaderProps) {
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm">
      {/* Left: Greeting */}
      <div className="text-lg font-medium text-muted-foreground">
        {greeting}
      </div>

      {/* Center: Date & Time */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-foreground font-medium">
          {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <span className="text-muted-foreground">•</span>
        <span className="text-foreground font-medium">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Right: Status */}
      <div className="flex items-center gap-2">
        {isConnected && (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <div className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
            Live
          </Badge>
        )}
      </div>
    </div>
  );
}
