import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cacheConfig } from '@/lib/query-client';

export interface JobApplication {
  id: string;
  personal_info: any;
  availability: any;
  emergency_contact: any;
  employment_history: any;
  reference_info: any;
  skills_experience: any;
  declarations: any;
  consent: any;
  status: string;
  created_at: string;
  updated_at: string;
}

// Query Keys
export const jobApplicationQueryKeys = {
  all: ['job-applications'] as const,
  list: (filters?: any) => [...jobApplicationQueryKeys.all, 'list', filters] as const,
  statusSettings: () => [...jobApplicationQueryKeys.all, 'status-settings'] as const,
} as const;

// Data fetching functions
export const fetchJobApplications = async (filters?: {
  statusFilter?: string;
  sortField?: string;
  sortDirection?: string;
  dateRange?: { from?: Date; to?: Date };
  page?: number;
  pageSize?: number;
}) => {
  let query = supabase
    .from('job_applications')
    .select('*', { count: 'exact' });

  if (filters?.statusFilter && filters.statusFilter !== 'all') {
    query = query.eq('status', filters.statusFilter);
  }

  if (filters?.dateRange?.from) {
    query = query.gte('created_at', filters.dateRange.from.toISOString());
  }
  if (filters?.dateRange?.to) {
    const toDate = new Date(filters.dateRange.to);
    toDate.setDate(toDate.getDate() + 1);
    query = query.lt('created_at', toDate.toISOString());
  }

  if (filters?.sortField === 'created_at') {
    query = query.order('created_at', { ascending: filters.sortDirection === 'asc' });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  if (filters?.page && filters?.pageSize) {
    const from = (filters.page - 1) * filters.pageSize;
    const toIdx = from + filters.pageSize - 1;
    query = query.range(from, toIdx);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  
  return {
    applications: data || [],
    totalCount: count || 0,
  };
};

export const fetchStatusOptions = async () => {
  const { data, error } = await supabase
    .from('application_status_settings')
    .select('status_name, display_order, is_active')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
    
  if (error) throw error;
  
  const statusOptions = data?.map(d => d.status_name).filter(Boolean) || [];
  return statusOptions.length > 0 ? statusOptions : ['new', 'reviewing', 'interviewed', 'accepted', 'rejected'];
};

// Query Hooks
export function useJobApplications(filters?: {
  statusFilter?: string;
  sortField?: string;
  sortDirection?: string;
  dateRange?: { from?: Date; to?: Date };
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: jobApplicationQueryKeys.list(filters),
    queryFn: () => fetchJobApplications(filters),
    ...cacheConfig.dynamic,
  });
}

export function useJobApplicationStatusOptions() {
  return useQuery({
    queryKey: jobApplicationQueryKeys.statusSettings(),
    queryFn: fetchStatusOptions,
    ...cacheConfig.static,
  });
}

// Mutation Hooks
export function useJobApplicationActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteApplication = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobApplicationQueryKeys.all });
      toast({
        title: "Application Deleted",
        description: "The job application has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    },
  });

  return {
    deleteApplication,
  };
}