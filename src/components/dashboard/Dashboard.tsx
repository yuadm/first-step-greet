import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeAnalytics } from "@/hooks/useRealTimeAnalytics";
import { CommandHero } from "./redesign/CommandHero";
import { MetricsOverview } from "./redesign/MetricsOverview";
import { BranchBreakdown } from "./redesign/BranchBreakdown";
import { ActivityTimeline } from "./redesign/ActivityTimeline";
import { PerformanceLeaderboard } from "./redesign/PerformanceLeaderboard";
import { DocumentHealth } from "./redesign/DocumentHealth";
import { UpcomingEvents } from "./redesign/UpcomingEvents";
import { TrendingMetrics } from "./redesign/TrendingMetrics";

interface DashboardData {
  totalEmployees: number;
  activeProjects: number;
  pendingTasks: number;
  completionRate: number;
  leavesByBranch?: Record<string, number>;
  complianceRates?: Record<string, number>;
  branches: Array<{ name: string; employeeCount: number; clientCount: number; color: string }>;
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
    
    // Set up real-time subscriptions for activity updates
    const channel = supabase
      .channel('dashboard-activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'document_tracker' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'compliance_period_records' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applications' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch employees
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      // Fetch total clients
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch pending leaves with branch breakdown
      const { data: pendingLeaves } = await supabase
        .from('leave_requests')
        .select('*, employees!inner(branch)')
        .eq('status', 'pending');

      const leavesByBranch = pendingLeaves?.reduce((acc, leave) => {
        const branch = leave.employees?.branch || 'Unknown';
        acc[branch] = (acc[branch] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate compliance rate by branch
      const { data: allCompliance } = await supabase
        .from('compliance_period_records')
        .select('status, employee_id, employees!compliance_period_records_employee_id_fkey(branch)');

      const complianceByBranch = allCompliance?.reduce((acc, record) => {
        const branch = (record.employees as any)?.branch || 'Unknown';
        if (!acc[branch]) {
          acc[branch] = { total: 0, completed: 0 };
        }
        acc[branch].total++;
        if (record.status === 'completed') {
          acc[branch].completed++;
        }
        return acc;
      }, {} as Record<string, { total: number; completed: number }>) || {};

      const complianceRates = Object.entries(complianceByBranch).reduce((acc, [branch, data]) => {
        acc[branch] = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
        return acc;
      }, {} as Record<string, number>);

      const overallCompletionRate = allCompliance && allCompliance.length > 0
        ? Math.round((allCompliance.filter(r => r.status === 'completed').length / allCompliance.length) * 100)
        : 0;

      // Fetch branches with employee and client counts
      const { data: branchesData } = await supabase
        .from('branches')
        .select('id, name');

      const branchColors = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];
      
      const branches = await Promise.all(
        (branchesData || []).map(async (branch, index) => {
          const { count: empCount } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('branch_id', branch.id)
            .eq('is_active', true);

          const { count: clientCount } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('branch_id', branch.id)
            .eq('is_active', true);

          return {
            name: branch.name,
            employeeCount: empCount || 0,
            clientCount: clientCount || 0,
            color: branchColors[index % branchColors.length]
          };
        })
      );

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

      // Fetch recent activity from multiple sources
      const recentActivity = [];

      // Recent employees (created)
      const { data: recentEmployees } = await supabase
        .from('employees')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      recentEmployees?.forEach(emp => {
        recentActivity.push({
          id: `emp-${emp.id}`,
          type: 'employee',
          message: `New employee onboarded: ${emp.name}`,
          timestamp: emp.created_at,
          user: 'System'
        });
      });

      // Recent documents (updated)
      const { data: recentDocs } = await supabase
        .from('document_tracker')
        .select('id, updated_at, employees(name)')
        .order('updated_at', { ascending: false })
        .limit(5);

      recentDocs?.forEach(doc => {
        const employeeName = (doc.employees as any)?.name || 'Unknown';
        recentActivity.push({
          id: `doc-${doc.id}`,
          type: 'document',
          message: `Document updated for ${employeeName}`,
          timestamp: doc.updated_at,
          user: employeeName
        });
      });

      // Recent compliance completions
      const { data: recentCompliance } = await supabase
        .from('compliance_period_records')
        .select('id, updated_at, status, employees(name), compliance_types(name)')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(5);

      recentCompliance?.forEach(comp => {
        const employeeName = (comp.employees as any)?.name || 'Unknown';
        const complianceType = (comp.compliance_types as any)?.name || 'training';
        recentActivity.push({
          id: `comp-${comp.id}`,
          type: 'compliance',
          message: `${complianceType} completed by ${employeeName}`,
          timestamp: comp.updated_at,
          user: employeeName
        });
      });

      // Recent leave requests
      const { data: recentLeaves } = await supabase
        .from('leave_requests')
        .select('id, created_at, status, employees(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      recentLeaves?.forEach(leave => {
        const employeeName = (leave.employees as any)?.name || 'Unknown';
        recentActivity.push({
          id: `leave-${leave.id}`,
          type: 'document',
          message: `Leave request ${leave.status} for ${employeeName}`,
          timestamp: leave.created_at,
          user: employeeName
        });
      });

      // Recent job applications
      const { data: recentApps } = await supabase
        .from('job_applications')
        .select('id, created_at, personal_info')
        .order('created_at', { ascending: false })
        .limit(3);

      recentApps?.forEach(app => {
        const personalInfo = app.personal_info as any;
        const name = personalInfo?.full_name || 'Applicant';
        recentActivity.push({
          id: `app-${app.id}`,
          type: 'employee',
          message: `New job application received from ${name}`,
          timestamp: app.created_at,
          user: name
        });
      });

      // Sort all activities by timestamp and take the top 10
      const sortedActivity = recentActivity
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      setData({
        totalEmployees: employeeCount || 0,
        activeProjects: clientsCount || 0,
        pendingTasks: pendingLeaves?.length || 0,
        completionRate: overallCompletionRate,
        leavesByBranch,
        complianceRates,
        branches,
        recentActivity: sortedActivity,
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
        leavesByBranch={data.leavesByBranch}
        complianceRates={data.complianceRates}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Branch & Performance */}
        <div className="space-y-6">
          <BranchBreakdown branches={data.branches} />
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
    </div>
  );
}
