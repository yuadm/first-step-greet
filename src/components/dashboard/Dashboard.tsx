import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeAnalytics } from "@/hooks/useRealTimeAnalytics";
import { CommandHero } from "./redesign/CommandHero";
import { MetricsOverview } from "./redesign/MetricsOverview";
import { DepartmentBreakdown } from "./redesign/DepartmentBreakdown";
import { ActivityTimeline } from "./redesign/ActivityTimeline";
import { PerformanceLeaderboard } from "./redesign/PerformanceLeaderboard";
import { DocumentHealth } from "./redesign/DocumentHealth";
import { QuickActionGrid } from "./redesign/QuickActionGrid";
import { UpcomingEvents } from "./redesign/UpcomingEvents";
import { TrendingMetrics } from "./redesign/TrendingMetrics";

interface DashboardData {
  totalEmployees: number;
  activeProjects: number;
  pendingTasks: number;
  completionRate: number;
  departments: Array<{ name: string; count: number; color: string }>;
  recentActivity: Array<{ id: string; type: string; message: string; timestamp: string; user: string }>;
  topPerformers: Array<{ id: string; name: string; score: number; avatar: string; trend: number }>;
  documentStats: { total: number; valid: number; expiring: number; expired: number };
  upcomingEvents: Array<{ id: string; title: string; date: string; type: string }>;
  trends: Array<{ label: string; current: number; previous: number; change: number }>;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { metrics, isConnected } = useRealTimeAnalytics();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch employees
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      // Fetch compliance tasks
      const { count: tasksCount } = await supabase
        .from('compliance_period_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch document stats
      const { data: documents } = await supabase
        .from('document_tracker')
        .select('status, expiry_date');

      const documentStats = {
        total: documents?.length || 0,
        valid: documents?.filter(d => d.status === 'valid').length || 0,
        expiring: documents?.filter(d => d.status === 'expiring').length || 0,
        expired: documents?.filter(d => d.status === 'expired').length || 0,
      };

      // Mock department data (would come from employees table with joins)
      const departments = [
        { name: 'Care', count: Math.floor((employeeCount || 0) * 0.4), color: '#0ea5e9' },
        { name: 'Admin', count: Math.floor((employeeCount || 0) * 0.2), color: '#8b5cf6' },
        { name: 'Support', count: Math.floor((employeeCount || 0) * 0.25), color: '#f59e0b' },
        { name: 'Management', count: Math.floor((employeeCount || 0) * 0.15), color: '#10b981' },
      ];

      setData({
        totalEmployees: employeeCount || 0,
        activeProjects: Math.floor((employeeCount || 0) * 0.3),
        pendingTasks: tasksCount || 0,
        completionRate: 87,
        departments,
        recentActivity: [
          { id: '1', type: 'employee', message: 'New employee onboarded', timestamp: new Date().toISOString(), user: 'Sarah Johnson' },
          { id: '2', type: 'document', message: 'Document verification completed', timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'Mike Chen' },
          { id: '3', type: 'compliance', message: 'Compliance training completed', timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'Emma Wilson' },
        ],
        topPerformers: [
          { id: '1', name: 'Sarah Johnson', score: 98, avatar: 'SJ', trend: 5 },
          { id: '2', name: 'Mike Chen', score: 95, avatar: 'MC', trend: 3 },
          { id: '3', name: 'Emma Wilson', score: 92, avatar: 'EW', trend: -2 },
          { id: '4', name: 'James Brown', score: 89, avatar: 'JB', trend: 7 },
          { id: '5', name: 'Lisa Davis', score: 87, avatar: 'LD', trend: 1 },
        ],
        documentStats,
        upcomingEvents: [
          { id: '1', title: 'Team Training Session', date: new Date(Date.now() + 86400000).toISOString(), type: 'training' },
          { id: '2', title: 'Compliance Deadline', date: new Date(Date.now() + 172800000).toISOString(), type: 'deadline' },
          { id: '3', title: 'Performance Reviews', date: new Date(Date.now() + 259200000).toISOString(), type: 'review' },
        ],
        trends: [
          { label: 'Onboarding Speed', current: 4.2, previous: 5.1, change: -17.6 },
          { label: 'Compliance Rate', current: 94, previous: 89, change: 5.6 },
          { label: 'Doc Completion', current: 87, previous: 82, change: 6.1 },
          { label: 'Employee Satisfaction', current: 4.8, previous: 4.6, change: 4.3 },
        ],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error loading dashboard",
        description: "Could not fetch dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-muted/50 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-muted/50 rounded-2xl"></div>
          <div className="h-96 bg-muted/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Command Hero */}
      <CommandHero isConnected={isConnected} />

      {/* Metrics Overview */}
      <MetricsOverview
        totalEmployees={data.totalEmployees}
        activeProjects={data.activeProjects}
        pendingTasks={data.pendingTasks}
        completionRate={data.completionRate}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Department & Performance */}
        <div className="space-y-6">
          <DepartmentBreakdown departments={data.departments} />
          <PerformanceLeaderboard performers={data.topPerformers} />
        </div>

        {/* Center Column - Activity & Trends */}
        <div className="space-y-6">
          <ActivityTimeline activities={data.recentActivity} />
          <TrendingMetrics trends={data.trends} />
        </div>

        {/* Right Column - Documents & Events */}
        <div className="space-y-6">
          <DocumentHealth stats={data.documentStats} />
          <UpcomingEvents events={data.upcomingEvents} />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActionGrid />
    </div>
  );
}
