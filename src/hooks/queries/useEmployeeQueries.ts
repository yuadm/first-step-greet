import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cacheConfig } from '@/lib/query-client';

interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  branch: string;
  branch_id?: string;
  employee_code: string;
  job_title?: string;
  employee_type?: string;
  working_hours?: number;
  leave_allowance?: number;
  leave_taken?: number;
  remaining_leave_days?: number;
  hours_restriction?: string;
  is_active?: boolean;
  password_hash?: string;
  created_at?: string;
}

interface Branch {
  id: string;
  name: string;
}

// Query keys for consistent cache management
export const employeeQueryKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...employeeQueryKeys.lists(), { filters }] as const,
  details: () => [...employeeQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeQueryKeys.details(), id] as const,
  branches: ['employee-branches'] as const,
};

// Fetch employees
async function fetchEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

// Fetch branches
async function fetchEmployeeBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('id, name')
    .order('name');

  if (error) throw error;
  return data || [];
}

// React Query hooks
export function useEmployees() {
  return useQuery({
    queryKey: employeeQueryKeys.lists(),
    queryFn: fetchEmployees,
    ...cacheConfig.dynamic, // Dynamic user data gets medium cache
  });
}

export function useEmployeeBranches() {
  return useQuery({
    queryKey: employeeQueryKeys.branches,
    queryFn: fetchEmployeeBranches,
    ...cacheConfig.static, // Static reference data gets long cache
  });
}

// Mutation hooks for employee actions
export function useEmployeeActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createEmployee = useMutation({
    mutationFn: async (employeeData: Omit<Employee, 'id' | 'created_at'> & { password_hash?: string }) => {
      const { data, error } = await supabase
        .from('employees')
        .insert([{ 
          ...employeeData,
          password_hash: employeeData.password_hash || 'default_hash'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    // Optimistic update for immediate UI feedback
    onMutate: async (newEmployee) => {
      await queryClient.cancelQueries({ queryKey: employeeQueryKeys.lists() });
      
      const previousEmployees = queryClient.getQueryData<Employee[]>(employeeQueryKeys.lists());
      
      // Create optimistic employee with temporary ID
      const optimisticEmployee = {
        ...newEmployee,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData<Employee[]>(employeeQueryKeys.lists(), (old) => {
        if (!old) return [optimisticEmployee];
        return [optimisticEmployee, ...old];
      });
      
      return { previousEmployees };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
      toast({
        title: "Success",
        description: "Employee created successfully.",
      });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(employeeQueryKeys.lists(), context.previousEmployees);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create employee.",
        variant: "destructive",
      });
    },
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Employee> & { id: string }) => {
      const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    // Optimistic update for immediate UI feedback
    onMutate: async ({ id, ...updateData }) => {
      await queryClient.cancelQueries({ queryKey: employeeQueryKeys.lists() });
      
      const previousEmployees = queryClient.getQueryData<Employee[]>(employeeQueryKeys.lists());
      
      queryClient.setQueryData<Employee[]>(employeeQueryKeys.lists(), (old) => {
        if (!old) return [];
        return old.map(employee => 
          employee.id === id 
            ? { ...employee, ...updateData }
            : employee
        );
      });
      
      return { previousEmployees };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
      toast({
        title: "Success",
        description: "Employee updated successfully.",
      });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(employeeQueryKeys.lists(), context.previousEmployees);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update employee.",
        variant: "destructive",
      });
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
      toast({
        title: "Success",
        description: "Employee deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete employee.",
        variant: "destructive",
      });
    },
  });

  const bulkImportEmployees = useMutation({
    mutationFn: async (employees: (Omit<Employee, 'id' | 'created_at'> & { password_hash?: string })[]) => {
      const employeesWithHash = employees.map(emp => ({
        ...emp,
        password_hash: emp.password_hash || 'default_hash'
      }));
      
      const { data, error } = await supabase
        .from('employees')
        .insert(employeesWithHash)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
      toast({
        title: "Success",
        description: `${data.length} employees imported successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import employees.",
        variant: "destructive",
      });
    },
  });

  return {
    createEmployee,
    updateEmployee,
    deleteEmployee,
    bulkImportEmployees,
  };
}