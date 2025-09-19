import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cacheConfig } from '@/lib/query-client';

// Types
export interface Client {
  id: string;
  name: string;
  branch_id: string;
  branches?: {
    name: string;
  };
}

export interface ClientSpotCheckRecord {
  id?: string;
  service_user_name?: string;
  care_workers?: string;
  date?: string;
  time?: string;
  performed_by?: string;
  observations?: any[];
}

export interface ClientComplianceRecord {
  id: string;
  client_id: string;
  period_identifier: string;
  status: string;
  completion_date?: string;
  completion_method?: string;
  notes?: string;
  clients?: Client;
  client_spot_check_records?: ClientSpotCheckRecord[];
}

export interface PeriodData {
  period_identifier: string;
  year: number;
  record_count: number;
  completion_rate: number;
  download_available: boolean;
  archive_due_date?: string;
  download_available_date?: string;
  is_current: boolean;
}

export interface ClientSpotCheckFormData {
  serviceUserName: string;
  date: string;
  completedBy: string;
  observations: any[];
}

// Query Keys
export const clientComplianceQueryKeys = {
  all: ['client-compliance'] as const,
  clients: (accessibleBranches: string[]) => [...clientComplianceQueryKeys.all, 'clients', accessibleBranches] as const,
  records: (typeId: string) => [...clientComplianceQueryKeys.all, 'records', typeId] as const,
  spotCheckRecord: (complianceRecordId: string) => [...clientComplianceQueryKeys.all, 'spot-check', complianceRecordId] as const,
} as const;

// Data fetching functions
export const fetchClientComplianceClients = async (accessibleBranches: string[], isAdmin: boolean): Promise<Client[]> => {
  let clientsQuery = supabase
    .from('clients')
    .select(`
      *,
      branches (
        name
      )
    `);
  
  // Apply branch filtering for non-admin users
  if (!isAdmin && accessibleBranches.length > 0) {
    clientsQuery = clientsQuery.in('branch_id', accessibleBranches);
  }
  
  const { data, error } = await clientsQuery.order('name');

  if (error) throw error;
  return data || [];
};

export const fetchClientComplianceRecords = async (complianceTypeId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('client_compliance_period_records')
    .select('*')
    .eq('client_compliance_type_id', complianceTypeId)
    .order('completion_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchSpotCheckRecord = async (complianceRecordId: string) => {
  const { data, error } = await supabase
    .from('client_spot_check_records')
    .select('*')
    .eq('compliance_record_id', complianceRecordId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    throw error;
  }
  return data;
};

// Query Hooks
export function useClientComplianceClients(accessibleBranches: string[], isAdmin: boolean) {
  return useQuery({
    queryKey: clientComplianceQueryKeys.clients(accessibleBranches),
    queryFn: () => fetchClientComplianceClients(accessibleBranches, isAdmin),
    ...cacheConfig.static,
  });
}

export function useClientComplianceRecords(complianceTypeId: string) {
  return useQuery({
    queryKey: clientComplianceQueryKeys.records(complianceTypeId),
    queryFn: () => fetchClientComplianceRecords(complianceTypeId),
    ...cacheConfig.realtime,
    enabled: !!complianceTypeId,
  });
}

export function useSpotCheckRecord(complianceRecordId: string) {
  return useQuery({
    queryKey: clientComplianceQueryKeys.spotCheckRecord(complianceRecordId),
    queryFn: () => fetchSpotCheckRecord(complianceRecordId),
    ...cacheConfig.dynamic,
    enabled: !!complianceRecordId,
  });
}

// Mutation Hooks
export function useClientComplianceActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const submitSpotCheck = useMutation({
    mutationFn: async ({
      complianceTypeId,
      clientId,
      periodIdentifier,
      data
    }: {
      complianceTypeId: string;
      clientId: string;
      periodIdentifier: string;
      data: ClientSpotCheckFormData;
    }) => {
      // Create or update the compliance period record
      const { data: updated, error: updateError } = await supabase
        .from('client_compliance_period_records')
        .update({
          status: 'completed',
          completion_date: data.date,
          completion_method: 'spotcheck'
        })
        .eq('client_compliance_type_id', complianceTypeId)
        .eq('client_id', clientId)
        .eq('period_identifier', periodIdentifier)
        .select('id');

      if (updateError) throw updateError;

      let complianceRecordId: string;

      if (updated && updated.length > 0) {
        complianceRecordId = updated[0].id;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('client_compliance_period_records')
          .insert({
            client_compliance_type_id: complianceTypeId,
            client_id: clientId,
            period_identifier: periodIdentifier,
            status: 'completed',
            completion_date: data.date,
            completion_method: 'spotcheck'
          })
          .select('id')
          .maybeSingle();

        if (insertError) throw insertError;
        if (!inserted) throw new Error('Failed to create compliance record');
        complianceRecordId = inserted.id;
      }

      // Save the spot check record
      const { error: spotCheckError } = await supabase
        .from('client_spot_check_records')
        .insert({
          client_id: clientId,
          compliance_record_id: complianceRecordId,
          service_user_name: data.serviceUserName,
          care_workers: '',
          date: data.date,
          time: '',
          performed_by: data.completedBy,
          observations: data.observations as any
        });

      if (spotCheckError) throw spotCheckError;

      return { complianceRecordId, clientId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: clientComplianceQueryKeys.all });
      toast({
        title: "Spot check completed",
        description: "Spot check has been saved successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error saving spot check:', error);
      toast({
        title: "Error saving spot check",
        description: "Could not save the spot check. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteComplianceRecord = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('client_compliance_period_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
    },
    // Optimistic update for immediate UI feedback
    onMutate: async (recordId) => {
      await queryClient.cancelQueries({ queryKey: clientComplianceQueryKeys.all });
      
      const previousData = queryClient.getQueryData(clientComplianceQueryKeys.all);
      
      // Update all records queries to remove the record
      queryClient.setQueriesData(
        { queryKey: clientComplianceQueryKeys.all },
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
      queryClient.invalidateQueries({ queryKey: clientComplianceQueryKeys.all });
      toast({
        title: "Record Deleted",
        description: "Client compliance record has been deleted successfully.",
      });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(clientComplianceQueryKeys.all, context.previousData);
      }
      console.error('Error deleting client compliance record:', error);
      toast({
        title: "Error",
        description: "Failed to delete compliance record",
        variant: "destructive",
      });
    },
  });

  return {
    submitSpotCheck,
    deleteComplianceRecord,
  };
}