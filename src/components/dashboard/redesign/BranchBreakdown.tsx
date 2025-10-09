import { Building2, Activity } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Branch {
  name: string;
  employeeCount: number;
  clientCount: number;
  color: string;
}

interface BranchHealth {
  branch_name: string;
  compliance_rate: number;
  document_validity_rate: number;
  leave_backlog: number;
  active_employees: number;
  overall_score: number;
}

interface BranchBreakdownProps {
  branches: Branch[];
  branchHealth: BranchHealth[];
}

export function BranchBreakdown({ branches, branchHealth }: BranchBreakdownProps) {
  const views = ['employees', 'clients', 'health'] as const;
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-success/10 text-success border-success/20';
    if (score >= 70) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };
  
  return (
    <div className="card-premium p-6">
      <Carousel 
        className="w-full"
        opts={{ loop: true }}
        plugins={[
          Autoplay({
            delay: 4000,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ]}
      >
        <CarouselContent>
          {views.map((view) => {
            if (view === 'health') {
              return (
                <CarouselItem key={view}>
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Branch Health Score</h3>
                        <p className="text-sm text-muted-foreground">
                          Overall performance metrics
                        </p>
                      </div>
                    </div>

                    {/* Branch Health List */}
                    <div className="space-y-3">
                      {branchHealth.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No branch data available</p>
                      ) : (
                        branchHealth.map((branch, index) => (
                          <div
                            key={index}
                            className="space-y-3 rounded-lg bg-muted/50 p-4 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold">{branch.branch_name}</h4>
                              <Badge className={getScoreBadge(branch.overall_score)}>
                                {branch.overall_score}%
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Compliance</span>
                                <span className={getScoreColor(branch.compliance_rate)}>{branch.compliance_rate}%</span>
                              </div>
                              <Progress value={branch.compliance_rate} className="h-1.5" />

                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Document Validity</span>
                                <span className={getScoreColor(branch.document_validity_rate)}>{branch.document_validity_rate}%</span>
                              </div>
                              <Progress value={branch.document_validity_rate} className="h-1.5" />

                              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50 mt-2">
                                <span className="text-muted-foreground">Active Employees</span>
                                <span className="font-medium">{branch.active_employees}</span>
                              </div>

                              {branch.leave_backlog > 0 && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Leave Backlog</span>
                                  <Badge variant="secondary" className="text-xs">{branch.leave_backlog}</Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CarouselItem>
              );
            }

            const total = branches.reduce((sum, branch) => 
              sum + (view === 'employees' ? branch.employeeCount : branch.clientCount), 0
            );

            return (
              <CarouselItem key={view}>
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Branch Distribution</h3>
                      <p className="text-sm text-muted-foreground">
                        {total} total {view === 'employees' ? 'employees' : 'clients'}
                      </p>
                    </div>
                  </div>

                  {/* Donut Chart */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {branches.map((branch, index) => {
                          const count = view === 'employees' ? branch.employeeCount : branch.clientCount;
                          const prevSum = branches.slice(0, index).reduce((sum, b) => 
                            sum + (view === 'employees' ? b.employeeCount : b.clientCount), 0
                          );
                          const offset = (prevSum / total) * 283;
                          const length = (count / total) * 283;
                          
                          return (
                            <circle
                              key={branch.name}
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke={branch.color}
                              strokeWidth="10"
                              strokeDasharray={`${length} 283`}
                              strokeDashoffset={-offset}
                              className="transition-all duration-1000"
                              style={{ opacity: 0.9 }}
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold">{total}</div>
                          <div className="text-xs text-muted-foreground">
                            {view === 'employees' ? 'Employees' : 'Clients'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-2">
                    {branches.map((branch) => {
                      const count = view === 'employees' ? branch.employeeCount : branch.clientCount;
                      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                      return (
                        <div key={branch.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: branch.color }}
                            />
                            <span className="text-sm font-medium">{branch.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{count}</span>
                            <span className="text-sm font-semibold" style={{ color: branch.color }}>
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
