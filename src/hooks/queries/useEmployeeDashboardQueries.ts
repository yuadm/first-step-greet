import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cacheConfig } from '@/lib/query-client';

// Query keys for consistent cache management
export const employeeDashboardQueryKeys = {
  all: ['employee-dashboard'] as const,
  leaves: (employeeId: string) => [...employeeDashboardQueryKeys.all, 'leaves', employeeId] as const,
  compliance: (employeeId: string) => [...employeeDashboardQueryKeys.all, 'compliance', employeeId] as const,
};

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  notes: string;
  leave_type: {
    name: string;
  };
  created_at: string;
}

// Fetch employee leave requests
async function fetchEmployeeLeaves(employeeId: string): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      leave_type:leave_types(name)
    `)
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// React Query hook for employee leaves
export function useEmployeeLeaves(employeeId: string) {
  return useQuery({
    queryKey: employeeDashboardQueryKeys.leaves(employeeId),
    queryFn: () => fetchEmployeeLeaves(employeeId),
    ...cacheConfig.realtime, // Real-time data with 1min stale time, 2min background sync
    enabled: !!employeeId,
  });
}