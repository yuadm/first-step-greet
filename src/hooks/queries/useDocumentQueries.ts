import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cacheConfig } from '@/lib/query-client';

export interface Document {
  id: string;
  employee_id: string;
  document_type_id: string;
  branch_id: string;
  document_number?: string;
  issue_date?: string;
  expiry_date: string;
  status: string;
  notes?: string;
  country?: string;
  nationality_status?: string;
  employees?: {
    name: string;
    email: string;
    branch: string;
  };
  document_types?: {
    name: string;
  };
}

export interface DocumentType {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  branch: string;
  branch_id: string;
  employee_code: string;
  sponsored?: boolean;
  twenty_hours?: boolean;
}

export interface Branch {
  id: string;
  name: string;
}

// Query Keys
export const documentQueryKeys = {
  all: ['documents'] as const,
  list: () => [...documentQueryKeys.all, 'list'] as const,
  employees: () => [...documentQueryKeys.all, 'employees'] as const,
  documentTypes: () => [...documentQueryKeys.all, 'document-types'] as const,
  branches: () => [...documentQueryKeys.all, 'branches'] as const,
} as const;

// Data fetching functions
export const fetchDocuments = async () => {
  const { data, error } = await supabase
    .from('document_tracker')
    .select(`
      *,
      employees (name, email, branch),
      document_types (name)
    `)
    .order('expiry_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const fetchDocumentEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name, email, branch, branch_id, employee_code, sponsored, twenty_hours')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const fetchDocumentTypes = async () => {
  const { data, error } = await supabase
    .from('document_types')
    .select('id, name')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const fetchDocumentBranches = async () => {
  const { data, error } = await supabase
    .from('branches')
    .select('id, name')
    .order('name');

  if (error) throw error;
  return data || [];
};

// Query Hooks
export function useDocuments() {
  return useQuery({
    queryKey: documentQueryKeys.list(),
    queryFn: fetchDocuments,
    ...cacheConfig.dynamic,
  });
}

export function useDocumentEmployees() {
  return useQuery({
    queryKey: documentQueryKeys.employees(),
    queryFn: fetchDocumentEmployees,
    ...cacheConfig.static,
  });
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: documentQueryKeys.documentTypes(),
    queryFn: fetchDocumentTypes,
    ...cacheConfig.static,
  });
}

export function useDocumentBranches() {
  return useQuery({
    queryKey: documentQueryKeys.branches(),
    queryFn: fetchDocumentBranches,
    ...cacheConfig.static,
  });
}

// Mutation Hooks
export function useDocumentActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createDocument = useMutation({
    mutationFn: async (documentData: any) => {
      const { data, error } = await supabase
        .from('document_tracker')
        .insert(documentData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.list() });
      toast({
        title: "Document added",
        description: "The document has been added successfully.",
      });
    },
    onError: (error) => {
      console.error('Error adding document:', error);
      toast({
        title: "Error adding document",
        description: "Could not add document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateDocument = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('document_tracker')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.list() });
      toast({
        title: "Document updated",
        description: "The document has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating document:', error);
      toast({
        title: "Error updating document",
        description: "Could not update document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteDocuments = useMutation({
    mutationFn: async (documentIds: string[]) => {
      const { error } = await supabase
        .from('document_tracker')
        .delete()
        .in('id', documentIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.list() });
      toast({
        title: "Documents deleted",
        description: "The selected documents have been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting documents:', error);
      toast({
        title: "Error deleting documents",
        description: "Could not delete documents. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    createDocument,
    updateDocument,
    deleteDocuments,
  };
}