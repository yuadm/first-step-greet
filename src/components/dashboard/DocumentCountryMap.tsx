import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { MapPin, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import worldMapData from "@/assets/world-countries-110m.json";

type CountryCounts = Record<string, number>;

export function DocumentCountryMap() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<CountryCounts>({});
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleReset = () => {
    setPosition({ coordinates: [0, 0], zoom: 1 });
  };

  const handleMoveEnd = (position: any) => {
    setPosition(position);
  };

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
    if (value <= 0) return "hsl(var(--muted) / 0.3)";
    const ratio = value / Math.max(1, max);
    if (ratio > 0.75) return "hsl(var(--primary) / 0.9)";
    if (ratio > 0.5) return "hsl(var(--primary) / 0.75)";
    if (ratio > 0.25) return "hsl(var(--primary) / 0.6)";
    return "hsl(var(--primary) / 0.45)";
  };

  const getLegendColor = (index: number) => {
    const opacities = [0.9, 0.75, 0.6, 0.45];
    return `hsl(var(--primary) / ${opacities[index]})`;
  };

  const handleCountryClick = (countryName: string) => {
    const employeeCount = counts[countryName.toLowerCase()];
    if (employeeCount > 0) {
      // Navigate to documents page - could add filtering by country if needed
      navigate('/documents');
    }
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
    <TooltipProvider>
      <div className="w-full space-y-6">
        {/* World Map */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Employee Global Distribution</h3>
                <p className="text-sm text-muted-foreground">Based on document records • Click countries to explore</p>
              </div>
            </div>
            
            {/* Map Controls */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={position.zoom >= 4}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={position.zoom <= 1}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleReset}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset View</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="w-full aspect-[2/1] rounded-xl border bg-background/50 overflow-hidden relative">
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
            <>
              <ComposableMap 
                projection="geoMercator"
                projectionConfig={{ 
                  scale: 100,
                  center: [0, 0]
                }}
                width={800}
                height={400}
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup
                  zoom={position.zoom}
                  center={position.coordinates as [number, number]}
                  onMoveEnd={handleMoveEnd}
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
                        const key = rawName.toLowerCase();
                        const value = counts[key] || 0;
                        const percentage = totalEmployees > 0 ? ((value / totalEmployees) * 100).toFixed(1) : "0.0";
                        
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={getFill(value)}
                            stroke="hsl(var(--border))"
                            strokeWidth={0.5}
                            onMouseEnter={() => setHoveredCountry(value > 0 ? rawName : null)}
                            onMouseLeave={() => setHoveredCountry(null)}
                            onClick={() => handleCountryClick(rawName)}
                            style={{
                              default: { 
                                outline: "none",
                                transition: "all 0.2s ease-in-out"
                              },
                              hover: { 
                                fill: value > 0 ? "hsl(var(--primary))" : "hsl(var(--muted) / 0.5)", 
                                outline: "none",
                                stroke: "hsl(var(--primary))",
                                strokeWidth: 1.5,
                                cursor: value > 0 ? "pointer" : "default"
                              },
                              pressed: { 
                                fill: "hsl(var(--primary) / 0.9)", 
                                outline: "none"
                              },
                            }}
                          />
                        );
                      });
                    }}
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>

              {/* Hover Tooltip */}
              {hoveredCountry && (
                <div className="absolute top-4 left-4 bg-popover border rounded-lg shadow-lg px-4 py-3 pointer-events-none z-10">
                  <p className="font-semibold text-sm">{hoveredCountry}</p>
                  <p className="text-xs text-muted-foreground">
                    {counts[hoveredCountry.toLowerCase()] || 0} employees
                    {totalEmployees > 0 && (
                      <span className="ml-1">
                        ({(((counts[hoveredCountry.toLowerCase()] || 0) / totalEmployees) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Color Legend */}
              <div className="absolute bottom-4 left-4 bg-popover border rounded-lg shadow-lg p-3 z-10">
                <p className="text-xs font-semibold mb-2">Employee Density</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-6 h-3 rounded-sm"
                        style={{ backgroundColor: getLegendColor(i) }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground w-20">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </>
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
    </TooltipProvider>
  );
}
