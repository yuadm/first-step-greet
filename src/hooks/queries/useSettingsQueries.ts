import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cacheConfig } from '@/lib/query-client';

// Query Keys
export const settingsQueryKeys = {
  all: ['settings'] as const,
  company: () => [...settingsQueryKeys.all, 'company'] as const,
  branches: () => [...settingsQueryKeys.all, 'branches'] as const,
  documentTypes: () => [...settingsQueryKeys.all, 'document-types'] as const,
  leaveTypes: () => [...settingsQueryKeys.all, 'leave-types'] as const,
} as const;

// Data fetching functions
export const fetchCompanySettings = async () => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Query Hooks
export function useCompanySettings() {
  return useQuery({
    queryKey: settingsQueryKeys.company(),
    queryFn: fetchCompanySettings,
    ...cacheConfig.settings,
  });
}

// Mutation Hooks
export function useSettingsActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateCompanySettings = useMutation({
    mutationFn: async (settings: any) => {
      const { data, error } = await supabase
        .from('company_settings')
        .upsert(settings)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.company() });
      toast({
        title: "Settings Updated",
        description: "Company settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  return {
    updateCompanySettings,
  };
}