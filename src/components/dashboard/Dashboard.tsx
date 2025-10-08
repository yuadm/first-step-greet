import { useEffect, useState } from "react";
import { Users, Calendar, FileX, Shield, TrendingUp, Clock, BarChart3, Activity, Brain, Zap, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentCountryMap } from "./DocumentCountryMap";
import { EmployeeGrowthChart } from "./analytics/EmployeeGrowthChart";
import { LeaveAnalyticsChart } from "./analytics/LeaveAnalyticsChart";
import { ComplianceHeatMap } from "./analytics/ComplianceHeatMap";
import { SmartInsightsPanel } from "./analytics/SmartInsightsPanel";
import { useRealTimeAnalytics } from "@/hooks/useRealTimeAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DashboardHero } from "./DashboardHero";
import { EnhancedStatCard } from "./EnhancedStatCard";
import { LiveActivityFeed } from "./LiveActivityFeed";
import { QuickMetrics } from "./QuickMetrics";

interface DashboardStats {
  totalEmployees: number;
  leavesThisMonth: number;
  expiringDocuments: number;
  complianceDue: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    leavesThisMonth: 0,
    expiringDocuments: 0,
    complianceDue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { metrics, isConnected } = useRealTimeAnalytics();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch total employees
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      // Fetch leaves this month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const { count: leavesCount } = await supabase
        .from('leaves')
        .select('*', { count: 'exact', head: true })
        .gte('start_date', `${currentMonth}-01`)
        .lt('start_date', `${currentMonth}-32`)
        .eq('status', 'approved');

      // Fetch expiring documents (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const { count: expiringDocsCount } = await supabase
        .from('document_tracker')
        .select('*', { count: 'exact', head: true })
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .gte('expiry_date', new Date().toISOString().split('T')[0]);

      // Fetch compliance tasks due (simplified - count all records)
      const { count: complianceCount } = await supabase
        .from('compliance_records')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalEmployees: employeeCount || 0,
        leavesThisMonth: leavesCount || 0,
        expiringDocuments: expiringDocsCount || 0,
        complianceDue: complianceCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error loading dashboard",
        description: "Could not fetch dashboard statistics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-gradient-to-r from-muted to-muted/50 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-muted rounded-xl"></div>
          <div className="h-96 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <DashboardHero />

      {/* Enhanced Stats Grid with Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedStatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          trend={{
            value: 12,
            direction: "up",
            label: "vs last month"
          }}
          sparklineData={[stats.totalEmployees - 50, stats.totalEmployees - 40, stats.totalEmployees - 30, stats.totalEmployees - 20, stats.totalEmployees - 10, stats.totalEmployees - 5, stats.totalEmployees]}
          variant="default"
        />
        
        <EnhancedStatCard
          title="Pending Approvals"
          value={metrics.pendingApprovals}
          icon={Clock}
          trend={{
            value: 5,
            direction: "down",
            label: "vs last week"
          }}
          sparklineData={[metrics.pendingApprovals + 10, metrics.pendingApprovals + 8, metrics.pendingApprovals + 5, metrics.pendingApprovals + 7, metrics.pendingApprovals + 3, metrics.pendingApprovals + 2, metrics.pendingApprovals]}
          variant="warning"
        />
        
        <EnhancedStatCard
          title="Overdue Compliance"
          value={metrics.overdueCompliance}
          icon={AlertTriangle}
          trend={{
            value: 15,
            direction: "down",
            label: "vs last month"
          }}
          sparklineData={[metrics.overdueCompliance + 20, metrics.overdueCompliance + 15, metrics.overdueCompliance + 12, metrics.overdueCompliance + 10, metrics.overdueCompliance + 5, metrics.overdueCompliance + 2, metrics.overdueCompliance]}
          variant="danger"
        />
        
        <EnhancedStatCard
          title="Expiring Soon"
          value={metrics.expiringDocuments}
          icon={FileX}
          trend={{
            value: 8,
            direction: "up",
            label: "next 7 days"
          }}
          sparklineData={[metrics.expiringDocuments - 5, metrics.expiringDocuments - 3, metrics.expiringDocuments - 2, metrics.expiringDocuments - 1, metrics.expiringDocuments, metrics.expiringDocuments + 1, metrics.expiringDocuments + 2]}
          variant="warning"
        />
      </div>

      {/* Advanced Analytics Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Live Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-premium p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Employee Growth Trends</h3>
                  <p className="text-sm text-muted-foreground">6-month hiring analysis</p>
                </div>
              </div>
              <EmployeeGrowthChart />
            </div>

            <div className="card-premium p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success to-success/80 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Leave Analytics</h3>
                  <p className="text-sm text-muted-foreground">Patterns and trends</p>
                </div>
              </div>
              <LeaveAnalyticsChart />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="card-premium p-6">
              <ComplianceHeatMap />
            </div>
            
            <div className="card-premium p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <FileX className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Documents by Country</h3>
                  <p className="text-sm text-muted-foreground">Interactive world map of document distribution</p>
                </div>
              </div>
              <DocumentCountryMap />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card-premium p-6">
                <SmartInsightsPanel />
              </div>
            </div>
            
            <div className="card-premium p-6">
              <QuickMetrics metrics={metrics} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-premium p-6">
              <LiveActivityFeed 
                activities={metrics.recentActivity} 
                isConnected={isConnected}
              />
            </div>

            <div className="card-premium p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success to-success/80 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">System Health</h3>
                  <p className="text-sm text-muted-foreground">Real-time monitoring</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-primary-soft">
                  <div className="text-2xl font-bold text-primary">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-warning-soft">
                  <div className="text-2xl font-bold text-warning">{metrics.pendingApprovals}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm text-muted-foreground">Monitoring</div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}