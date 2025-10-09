import { useState, useEffect } from "react";
import { Zap, Search, Users, FileText, TrendingUp, Calendar, Command } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CommandHeroProps {
  isConnected: boolean;
}

export function CommandHero({ isConnected }: CommandHeroProps) {
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const quickStats = [
    { label: "Active Staff", value: "142", icon: Users, trend: "+12%" },
    { label: "Documents", value: "1,284", icon: FileText, trend: "+8%" },
    { label: "Completion", value: "94%", icon: TrendingUp, trend: "+5%" },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70"></div>
      
      {/* Animated mesh overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1) 0%, transparent 50%)`,
        }}
      />
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Floating orbs with shimmer */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      
      <div className="relative z-10 p-6 md:p-10">
        {/* Header Section */}
        <div className="space-y-6 mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-bold text-white bg-clip-text animate-scale-in">
                  {greeting}
                </h1>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-xl hover:bg-white/30 transition-all">
                  <Zap className="w-3 h-3 mr-1 animate-pulse" />
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Badge>
                {isConnected && (
                  <Badge className="bg-success/30 text-white border-success/40 backdrop-blur-xl">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse mr-2" />
                    Live
                  </Badge>
                )}
              </div>
              <p className="text-lg md:text-xl text-white/80 font-medium">
                Your command center is ready
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="glass px-4 py-2.5 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white text-sm font-medium shadow-lg hover:bg-white/15 transition-all">
                <Calendar className="w-4 h-4 inline mr-2" />
                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Command Search Bar */}
          <div className="glass max-w-2xl backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-1.5 shadow-glow hover:bg-white/15 transition-all group">
            <div className="flex items-center gap-3 px-4 py-3">
              <Search className="w-5 h-5 text-white/60 group-hover:text-white/80 transition-colors" />
              <input
                type="text"
                placeholder="Search anything... (Cmd+K)"
                className="flex-1 bg-transparent text-white placeholder:text-white/50 outline-none text-sm"
              />
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white/70">
                <Command className="w-3 h-3" />K
              </kbd>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {quickStats.map((stat, index) => (
            <div
              key={stat.label}
              className="glass backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5 hover:bg-white/15 transition-all hover:scale-105 shadow-lg group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-white/10 rounded-xl group-hover:bg-white/20 transition-all">
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-success bg-success/20 px-2 py-1 rounded-full font-medium">
                  {stat.trend}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/70">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "New Employee", icon: Users },
            { label: "Upload Document", icon: FileText },
            { label: "View Reports", icon: TrendingUp },
          ].map((action) => (
            <Button
              key={action.label}
              variant="secondary"
              size="sm"
              className="glass backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-md"
            >
              <action.icon className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
