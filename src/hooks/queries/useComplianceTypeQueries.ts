import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cacheConfig } from '@/lib/query-client';

// Types
export interface ComplianceType {
  id: string;
  name: string;
  description: string;
  frequency: string;
  created_at: string;
}

export interface Employee {
  id: string;
  name: string;
  branch: string;
  branch_id?: string;
}

export interface Branch {
  id: string;
  name: string;
}

export interface ComplianceRecord {
  id: string;
  employee_id: string;
  period_identifier: string;
  completion_date: string;
  notes: string;
  form_data?: any | null;
  status: string;
  created_at: string;
  updated_at: string;
  completed_by: string | null;
  completion_method?: string;
}

export interface EmployeeComplianceStatus {
  employee: Employee;
  record: ComplianceRecord | null;
  status: 'compliant' | 'overdue' | 'due' | 'pending';
  currentPeriod: string;
}

// Query Keys
export const complianceTypeQueryKeys = {
  all: ['compliance-types'] as const,
  detail: (id: string) => [...complianceTypeQueryKeys.all, 'detail', id] as const,
  employees: () => [...complianceTypeQueryKeys.all, 'employees'] as const,
  branches: () => [...complianceTypeQueryKeys.all, 'branches'] as const,
  records: (typeId: string) => [...complianceTypeQueryKeys.all, 'records', typeId] as const,
  users: (userIds: string[]) => [...complianceTypeQueryKeys.all, 'users', userIds] as const,
} as const;

// Data fetching functions
export const fetchComplianceType = async (id: string): Promise<ComplianceType> => {
  const { data, error } = await supabase
    .from('compliance_types')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const fetchComplianceTypeEmployees = async (): Promise<Employee[]> => {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name, branch, branch_id')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const fetchComplianceTypeBranches = async (): Promise<Branch[]> => {
  const { data, error } = await supabase
    .from('branches')
    .select('id, name')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const fetchComplianceTypeRecords = async (typeId: string): Promise<ComplianceRecord[]> => {
  const { data, error } = await supabase
    .from('compliance_period_records')
    .select('*')
    .eq('compliance_type_id', typeId)
    .order('completion_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchCompletedByUsers = async (userIds: string[]) => {
  if (userIds.length === 0) return {};

  const { data, error } = await supabase
    .from('employees')
    .select('id, name')
    .in('id', userIds);

  if (error) throw error;
  
  const usersMap: { [key: string]: { name: string; created_at: string } } = {};
  data?.forEach(user => {
    usersMap[user.id] = {
      name: user.name,
      created_at: new Date().toISOString() // We don't have created_at in employees table
    };
  });
  
  return usersMap;
};

// Query Hooks
export function useComplianceTypeDetail(id: string) {
  return useQuery({
    queryKey: complianceTypeQueryKeys.detail(id),
    queryFn: () => fetchComplianceType(id),
    ...cacheConfig.static,
    enabled: !!id,
  });
}

export function useComplianceTypeEmployees() {
  return useQuery({
    queryKey: complianceTypeQueryKeys.employees(),
    queryFn: fetchComplianceTypeEmployees,
    ...cacheConfig.static,
  });
}

export function useComplianceTypeBranches() {
  return useQuery({
    queryKey: complianceTypeQueryKeys.branches(),
    queryFn: fetchComplianceTypeBranches,
    ...cacheConfig.static,
  });
}

export function useComplianceTypeRecords(typeId: string) {
  return useQuery({
    queryKey: complianceTypeQueryKeys.records(typeId),
    queryFn: () => fetchComplianceTypeRecords(typeId),
    ...cacheConfig.realtime,
    enabled: !!typeId,
  });
}

export function useCompletedByUsers(userIds: string[]) {
  return useQuery({
    queryKey: complianceTypeQueryKeys.users(userIds),
    queryFn: () => fetchCompletedByUsers(userIds),
    ...cacheConfig.dynamic,
    enabled: userIds.length > 0,
  });
}

// Mutation Hooks
export function useComplianceTypeActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteComplianceRecord = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('compliance_period_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
    },
    // Optimistic update for immediate UI feedback
    onMutate: async (recordId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: complianceTypeQueryKeys.all });
      
      const previousData = queryClient.getQueryData(complianceTypeQueryKeys.all);
      
      // Update all records queries to remove the record
      queryClient.setQueriesData(
        { queryKey: complianceTypeQueryKeys.all },
        (old: any) => {
          if (Array.isArray(old)) {
            return old.filter((record: any) => record.id !== recordId);
          }
          return old;
        }
      );
      
      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceTypeQueryKeys.all });
      toast({
        title: "Record Deleted",
        description: "Compliance record has been deleted successfully.",
      });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(complianceTypeQueryKeys.all, context.previousData);
      }
      console.error('Error deleting compliance record:', error);
      toast({
        title: "Error",
        description: "Failed to delete compliance record",
        variant: "destructive",
      });
    },
  });

  return {
    deleteComplianceRecord,
  };
}