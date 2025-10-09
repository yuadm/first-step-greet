import { Building2 } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface Branch {
  name: string;
  employeeCount: number;
  clientCount: number;
  color: string;
}

interface BranchBreakdownProps {
  branches: Branch[];
}

export function BranchBreakdown({ branches }: BranchBreakdownProps) {
  const views = ['employees', 'clients'] as const;
  
  return (
    <div className="card-premium p-6">
      <Carousel className="w-full">
        <CarouselContent>
          {views.map((view) => {
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
