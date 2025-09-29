import { useEffect, useState } from "react";
import { Users, Calendar, FileX, Shield, TrendingUp, Clock, BarChart3, Activity, Zap, AlertTriangle } from "lucide-react";
import { StatCard } from "./StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentCountryMap } from "./DocumentCountryMap";
import { AnalyticsCard } from "./analytics/AnalyticsCard";
import { EmployeeGrowthChart } from "./analytics/EmployeeGrowthChart";
import { LeaveAnalyticsChart } from "./analytics/LeaveAnalyticsChart";
import { ComplianceHeatMap } from "./analytics/ComplianceHeatMap";
import { useRealTimeAnalytics } from "@/hooks/useRealTimeAnalytics";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded-lg w-64"></div>
          <div className="h-5 bg-muted rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Advanced HR & Compliance Analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-2">
              <Activity className="w-3 h-3" />
              {isConnected ? "Live" : "Offline"}
            </Badge>
            <div className="text-sm text-muted-foreground">
              {metrics.activeUsers} active users
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Employees"
          value={stats.totalEmployees}
          change={{ value: 12, trend: 'up', period: 'vs last month' }}
          icon={Users}
          variant="default"
        />
        
        <AnalyticsCard
          title="Pending Approvals"
          value={metrics.pendingApprovals}
          change={{ value: 5, trend: 'down', period: 'vs last week' }}
          icon={Clock}
          variant="warning"
        />
        
        <AnalyticsCard
          title="Overdue Compliance"
          value={metrics.overdueCompliance}
          change={{ value: 15, trend: 'down', period: 'vs last month' }}
          icon={AlertTriangle}
          variant="danger"
        />
        
        <AnalyticsCard
          title="Expiring Soon"
          value={metrics.expiringDocuments}
          change={{ value: 8, trend: 'up', period: 'next 7 days' }}
          icon={FileX}
          variant="warning"
        />
      </div>

      {/* Advanced Analytics Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
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

          {/* Quick Actions Section */}
          <div className="card-premium p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <p className="text-sm text-muted-foreground">Common tasks and shortcuts</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-primary-soft hover:bg-primary-soft/80 transition-colors cursor-pointer">
                <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-sm font-medium">Add Employee</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-warning-soft hover:bg-warning-soft/80 transition-colors cursor-pointer">
                <Calendar className="w-6 h-6 text-warning mx-auto mb-2" />
                <div className="text-sm font-medium">Leave Request</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-success-soft hover:bg-success-soft/80 transition-colors cursor-pointer">
                <Shield className="w-6 h-6 text-success mx-auto mb-2" />
                <div className="text-sm font-medium">Compliance</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer">
                <FileX className="w-6 h-6 text-foreground mx-auto mb-2" />
                <div className="text-sm font-medium">Documents</div>
              </div>
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

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-premium p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Trend Analysis</h3>
                    <p className="text-sm text-muted-foreground">Performance metrics</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Employee Retention</span>
                    <span className="text-sm font-medium text-success">94.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Compliance Rate</span>
                    <span className="text-sm font-medium text-primary">87.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Document Processing</span>
                    <span className="text-sm font-medium text-warning">+12%</span>
                  </div>
                </div>
              </div>

              <div className="card-premium p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success to-success/80 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Department Stats</h3>
                    <p className="text-sm text-muted-foreground">Team performance</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Care Workers</span>
                    <Badge variant="secondary">42</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Managers</span>
                    <Badge variant="secondary">8</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Administrators</span>
                    <Badge variant="secondary">3</Badge>
                  </div>
                </div>
              </div>

              <div className="card-premium p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Upcoming Events</h3>
                    <p className="text-sm text-muted-foreground">Next 7 days</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="font-medium">Training Session</div>
                    <div className="text-muted-foreground">Tomorrow, 2:00 PM</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Compliance Review</div>
                    <div className="text-muted-foreground">Friday, 10:00 AM</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Team Meeting</div>
                    <div className="text-muted-foreground">Next Monday</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-premium p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Live Activity Feed</h3>
                    <p className="text-sm text-muted-foreground">Real-time system updates</p>
                  </div>
                </div>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Live" : "Offline"}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {metrics.recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  metrics.recentActivity.map((activity) => {
                    const getActivityIcon = (type: string) => {
                      switch (type) {
                        case 'leave': return Calendar;
                        case 'compliance': return Shield;
                        case 'employee': return Users;
                        default: return Activity;
                      }
                    };
                    
                    const Icon = getActivityIcon(activity.type);
                    
                    return (
                      <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="card-premium p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Critical Alerts</h3>
                    <p className="text-sm text-muted-foreground">Immediate attention needed</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {metrics.overdueCompliance > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-destructive-soft border border-destructive/20">
                      <div>
                        <p className="text-sm font-medium text-destructive">Overdue Compliance</p>
                        <p className="text-xs text-muted-foreground">{metrics.overdueCompliance} tasks</p>
                      </div>
                      <Badge variant="destructive">High</Badge>
                    </div>
                  )}
                  
                  {metrics.expiringDocuments > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-warning-soft border border-warning/20">
                      <div>
                        <p className="text-sm font-medium text-warning">Expiring Documents</p>
                        <p className="text-xs text-muted-foreground">Next 7 days</p>
                      </div>
                      <Badge variant="secondary">{metrics.expiringDocuments}</Badge>
                    </div>
                  )}
                  
                  {metrics.pendingApprovals > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary-soft border border-primary/20">
                      <div>
                        <p className="text-sm font-medium text-primary">Pending Approvals</p>
                        <p className="text-xs text-muted-foreground">Waiting for review</p>
                      </div>
                      <Badge variant="secondary">{metrics.pendingApprovals}</Badge>
                    </div>
                  )}
                </div>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}