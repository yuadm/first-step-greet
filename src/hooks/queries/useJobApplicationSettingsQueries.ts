import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cacheConfig } from '@/lib/query-client';

// Types
export interface SkillsCategory {
  id: string;
  setting_key: string;
  setting_value: {
    name: string;
    description: string | null;
    display_order: number;
    is_active: boolean;
    id: string;
  };
  display_order: number;
  is_active: boolean;
}

export interface Skill {
  id: string;
  setting_key: string;
  setting_value: {
    name: string;
    category_id: string | null;
    display_order: number;
    is_active: boolean;
  };
  display_order: number;
  is_active: boolean;
}

interface SkillsCategoryDB {
  id: string;
  category: string;
  setting_key: string;
  setting_type: string;
  setting_value: any;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SkillDB {
  id: string;
  category: string;
  setting_key: string;
  setting_type: string;
  setting_value: any;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Query Keys
export const jobApplicationSettingsQueryKeys = {
  all: ['job-application-settings'] as const,
  categories: () => [...jobApplicationSettingsQueryKeys.all, 'categories'] as const,
  skills: () => [...jobApplicationSettingsQueryKeys.all, 'skills'] as const,
} as const;

// Data fetching functions
export const fetchSkillsCategories = async (): Promise<SkillsCategory[]> => {
  const { data, error } = await supabase
    .from('job_application_settings')
    .select('*')
    .eq('category', 'skills')
    .eq('setting_type', 'category')
    .order('display_order');

  if (error) throw error;

  return (data || []).map((item: SkillsCategoryDB) => ({
    id: item.id,
    setting_key: item.setting_key,
    setting_value: item.setting_value as SkillsCategory['setting_value'],
    display_order: item.display_order,
    is_active: item.is_active
  }));
};

export const fetchSkills = async (): Promise<Skill[]> => {
  const { data, error } = await supabase
    .from('job_application_settings')
    .select('*')
    .eq('category', 'skills')
    .eq('setting_type', 'skill')
    .order('display_order');

  if (error) throw error;

  return (data || []).map((item: SkillDB) => ({
    id: item.id,
    setting_key: item.setting_key,
    setting_value: item.setting_value as Skill['setting_value'],
    display_order: item.display_order,
    is_active: item.is_active
  }));
};

// Query Hooks
export function useSkillsCategories() {
  return useQuery({
    queryKey: jobApplicationSettingsQueryKeys.categories(),
    queryFn: fetchSkillsCategories,
    ...cacheConfig.settings,
  });
}

export function useSkills() {
  return useQuery({
    queryKey: jobApplicationSettingsQueryKeys.skills(),
    queryFn: fetchSkills,
    ...cacheConfig.settings,
  });
}

// Mutation Hooks
export function useJobApplicationSettingsActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createCategory = useMutation({
    mutationFn: async (categoryData: {
      name: string;
      description: string;
      display_order: number;
      is_active: boolean;
    }) => {
      const settingData = {
        category: 'skills',
        setting_type: 'category',
        setting_key: categoryData.name,
        setting_value: {
          name: categoryData.name,
          description: categoryData.description,
          display_order: categoryData.display_order,
          is_active: categoryData.is_active,
          id: crypto.randomUUID()
        },
        display_order: categoryData.display_order,
        is_active: categoryData.is_active
      };

      const { data, error } = await supabase
        .from('job_application_settings')
        .insert([settingData])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobApplicationSettingsQueryKeys.categories() });
      toast({
        title: "Category created",
        description: "Skills category has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error creating category:', error);
      toast({
        title: "Error creating category",
        description: "Could not create category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ 
      id, 
      categoryData 
    }: { 
      id: string; 
      categoryData: {
        name: string;
        description: string;
        display_order: number;
        is_active: boolean;
        originalId: string;
      };
    }) => {
      const settingData = {
        category: 'skills',
        setting_type: 'category',
        setting_key: categoryData.name,
        setting_value: {
          name: categoryData.name,
          description: categoryData.description,
          display_order: categoryData.display_order,
          is_active: categoryData.is_active,
          id: categoryData.originalId
        },
        display_order: categoryData.display_order,
        is_active: categoryData.is_active
      };

      const { data, error } = await supabase
        .from('job_application_settings')
        .update(settingData)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobApplicationSettingsQueryKeys.categories() });
      toast({
        title: "Category updated",
        description: "Skills category has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating category:', error);
      toast({
        title: "Error updating category",
        description: "Could not update category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_application_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobApplicationSettingsQueryKeys.categories() });
      toast({
        title: "Category deleted",
        description: "Skills category has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting category:', error);
      toast({
        title: "Error deleting category",
        description: "Could not delete category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createSkill = useMutation({
    mutationFn: async (skillData: {
      name: string;
      category_id: string;
      display_order: number;
      is_active: boolean;
    }) => {
      const settingData = {
        category: 'skills',
        setting_type: 'skill',
        setting_key: skillData.name,
        setting_value: {
          name: skillData.name,
          category_id: skillData.category_id,
          display_order: skillData.display_order,
          is_active: skillData.is_active
        },
        display_order: skillData.display_order,
        is_active: skillData.is_active
      };

      const { data, error } = await supabase
        .from('job_application_settings')
        .insert([settingData])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobApplicationSettingsQueryKeys.skills() });
      toast({
        title: "Skill created",
        description: "Skill has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error creating skill:', error);
      toast({
        title: "Error creating skill",
        description: "Could not create skill. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSkill = useMutation({
    mutationFn: async ({ 
      id, 
      skillData 
    }: { 
      id: string; 
      skillData: {
        name: string;
        category_id: string;
        display_order: number;
        is_active: boolean;
      };
    }) => {
      const settingData = {
        category: 'skills',
        setting_type: 'skill',
        setting_key: skillData.name,
        setting_value: {
          name: skillData.name,
          category_id: skillData.category_id,
          display_order: skillData.display_order,
          is_active: skillData.is_active
        },
        display_order: skillData.display_order,
        is_active: skillData.is_active
      };

      const { data, error } = await supabase
        .from('job_application_settings')
        .update(settingData)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobApplicationSettingsQueryKeys.skills() });
      toast({
        title: "Skill updated",
        description: "Skill has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating skill:', error);
      toast({
        title: "Error updating skill",
        description: "Could not update skill. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteSkill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_application_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobApplicationSettingsQueryKeys.skills() });
      toast({
        title: "Skill deleted",
        description: "Skill has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting skill:', error);
      toast({
        title: "Error deleting skill",
        description: "Could not delete skill. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    createSkill,
    updateSkill,
    deleteSkill,
  };
}