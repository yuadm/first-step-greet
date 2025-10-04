import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Languages } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface LanguageStats {
  language: string;
  count: number;
}

interface LanguageStatsCardProps {
  languageStats: LanguageStats[];
  totalLanguages: number;
  onLanguageClick?: (language: string) => void;
}

export function LanguageStatsCard({ languageStats, totalLanguages, onLanguageClick }: LanguageStatsCardProps) {
  const chartData = languageStats.slice(0, 5).map(stat => ({
    language: stat.language,
    applicants: stat.count
  }));

  const chartConfig = {
    applicants: {
      label: "Applicants",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5" />
          Language Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted">
            <div className="text-2xl font-bold">{totalLanguages}</div>
            <div className="text-sm text-muted-foreground">Unique Languages</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <div className="text-2xl font-bold">{languageStats.length > 0 ? languageStats[0].count : 0}</div>
            <div className="text-sm text-muted-foreground">Top Language</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <div className="text-2xl font-bold">
              {languageStats.reduce((sum, stat) => sum + stat.count, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Speakers</div>
          </div>
        </div>

        {chartData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Top 5 Languages</h4>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="language" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="applicants" 
                    fill="var(--color-applicants)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium mb-2">All Languages ({languageStats.length})</h4>
          <div className="flex flex-wrap gap-2">
            {languageStats.map((stat) => (
              <Badge
                key={stat.language}
                variant="secondary"
                className={onLanguageClick ? "cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" : ""}
                onClick={() => onLanguageClick?.(stat.language)}
              >
                {stat.language} ({stat.count})
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
