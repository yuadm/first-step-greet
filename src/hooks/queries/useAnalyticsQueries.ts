import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cacheConfig } from '@/lib/query-client';

// Types
export interface CountryCounts {
  [country: string]: number;
}

export interface DocumentCountryData {
  country: string;
  employee_id: string;
}

// Query Keys
export const analyticsQueryKeys = {
  all: ['analytics'] as const,
  documentCountryMap: () => [...analyticsQueryKeys.all, 'document-country-map'] as const,
} as const;

// Data fetching functions
export const fetchDocumentCountryData = async (): Promise<CountryCounts> => {
  const { data, error } = await supabase
    .from("document_tracker")
    .select("country, employee_id");
    
  if (error) throw error;
  
  // Count unique employees per country
  const employeesByCountry: Record<string, Set<string>> = {};
  (data || []).forEach((row: DocumentCountryData) => {
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
  
  return map;
};

// Query Hooks
export function useDocumentCountryMap() {
  return useQuery({
    queryKey: analyticsQueryKeys.documentCountryMap(),
    queryFn: fetchDocumentCountryData,
    ...cacheConfig.dynamic, // 5 minutes stale time with background sync
  });
}