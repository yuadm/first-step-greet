import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { MapPin } from "lucide-react";
import worldMapData from "@/assets/world-countries-110m.json";

type CountryCounts = Record<string, number>;

// Normalize country names for matching between database and map
const normalizeCountryName = (name: string) => {
  const normalized = name.toLowerCase().trim();
  // Handle common variations between database and TopoJSON
  const mappings: Record<string, string> = {
    'antigua and barb.': 'antigua and barbuda',
    'bosnia and herz.': 'bosnia and herzegovina',
    'eq. guinea': 'equatorial guinea',
    'dominican rep.': 'dominican republic',
    'dem. rep. congo': 'democratic republic of the congo',
    'central african rep.': 'central african republic',
    's. sudan': 'south sudan',
    'solomon is.': 'solomon islands',
    'n. cyprus': 'northern cyprus',
  };
  return mappings[normalized] || normalized;
};

export function DocumentCountryMap() {
  const [counts, setCounts] = useState<CountryCounts>({});
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("document_tracker")
          .select("country, employee_id");
        if (error) throw error;
        
        // Count unique employees per country
        const employeesByCountry: Record<string, Set<string>> = {};
        (data || []).forEach((row: any) => {
          const country = (row?.country || "").trim();
          const employeeId = row?.employee_id;
          if (!country || !employeeId) return;
          
          const key = country.toLowerCase();
          if (!employeesByCountry[key]) {
            employeesByCountry[key] = new Set();
          }
          employeesByCountry[key].add(employeeId);
        });
        
        // Convert to counts
        const map: CountryCounts = {};
        Object.entries(employeesByCountry).forEach(([country, employeeSet]) => {
          map[country] = employeeSet.size;
        });
        
        setCounts(map);
      } catch (e) {
        console.error("Failed to load employee country distribution", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const max = useMemo(() => {
    return Object.values(counts).reduce((a, b) => Math.max(a, b), 0) || 0;
  }, [counts]);

  const getFill = (value: number) => {
    if (value <= 0) return "hsl(var(--muted))";
    const ratio = value / Math.max(1, max);
    // Use more prominent primary colors for countries with employees
    if (ratio > 0.75) return "hsl(var(--primary) / 0.9)";
    if (ratio > 0.5) return "hsl(var(--primary) / 0.7)";
    if (ratio > 0.25) return "hsl(var(--primary) / 0.5)";
    return "hsl(var(--primary) / 0.35)";
  };

  const totalEmployees = useMemo(() => {
    return Object.values(counts).reduce((a, b) => a + b, 0);
  }, [counts]);

  const topCountries = useMemo(() => {
    return Object.entries(counts)
      .map(([country, count]) => ({
        country: country.charAt(0).toUpperCase() + country.slice(1),
        count,
        percentage: totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(1) : "0.0"
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [counts, totalEmployees]);

  return (
    <div className="w-full space-y-6">
      {/* World Map */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Employee Global Distribution</h3>
            <p className="text-sm text-muted-foreground">Based on document records</p>
          </div>
        </div>

        <div className="w-full aspect-[2/1] rounded-xl border bg-background/50 overflow-hidden">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : mapError ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Map temporarily unavailable</p>
              </div>
            </div>
          ) : (
            <ComposableMap 
              projection="geoMercator"
              projectionConfig={{ 
                scale: 135,
                center: [10, 20]
              }}
              width={800}
              height={400}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies 
                geography={worldMapData}
                onError={(error) => {
                  console.error("Map loading error:", error);
                  setMapError(true);
                }}
              >
                {({ geographies }) => {
                  if (!mapLoaded) {
                    console.log("Map geographies loaded:", geographies.length);
                    setMapLoaded(true);
                  }
                  return geographies.map((geo) => {
                    const rawName =
                      (geo.properties?.name as string) ||
                      (geo.properties?.NAME as string) ||
                      (geo.properties?.NAME_LONG as string) ||
                      "";
                    const normalizedName = normalizeCountryName(rawName);
                    const value = counts[normalizedName] || 0;
                    const percentage = totalEmployees > 0 ? ((value / totalEmployees) * 100).toFixed(1) : "0.0";
                    const hasEmployees = value > 0;
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getFill(value)}
                        stroke={hasEmployees ? "hsl(var(--primary))" : "hsl(var(--border))"}
                        strokeWidth={hasEmployees ? 1 : 0.5}
                        style={{
                          default: { 
                            outline: "none",
                            transition: "all 0.2s ease-in-out"
                          },
                          hover: { 
                            fill: hasEmployees ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)", 
                            outline: "none",
                            stroke: hasEmployees ? "hsl(var(--primary))" : "hsl(var(--border))",
                            strokeWidth: hasEmployees ? 1.5 : 0.5,
                            cursor: hasEmployees ? "pointer" : "default"
                          },
                          pressed: { 
                            fill: hasEmployees ? "hsl(var(--primary) / 0.95)" : "hsl(var(--muted))", 
                            outline: "none"
                          },
                        }}
                      >
                        {hasEmployees && (
                          <title>
                            {rawName}: {value} employee{value !== 1 ? 's' : ''} ({percentage}%)
                          </title>
                        )}
                      </Geography>
                    );
                  });
                }}
              </Geographies>
            </ComposableMap>
          )}
        </div>
      </div>

      {/* Top Countries Statistics */}
      <div className="card-premium p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Top Countries by Employees</h3>
          <span className="text-sm text-muted-foreground">Total: {totalEmployees} employees</span>
        </div>
        
        <div className="grid gap-3">
          {topCountries.map((item, index) => (
            <div key={item.country} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {index + 1}
                </div>
                <span className="font-medium">{item.country}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium">{item.count} employees</div>
                  <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                </div>
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
