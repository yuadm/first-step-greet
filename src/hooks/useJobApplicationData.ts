import { useJobApplications, useJobApplicationStatusOptions, useLanguageStatistics } from '@/hooks/queries/useJobApplicationQueries';

export function useJobApplicationData(filters?: {
  statusFilter?: string;
  sortField?: string;
  sortDirection?: string;
  dateRange?: { from?: Date; to?: Date };
  page?: number;
  pageSize?: number;
  languages?: string[];
}) {
  const applicationsQuery = useJobApplications(filters);
  const statusOptionsQuery = useJobApplicationStatusOptions();
  const languageStatsQuery = useLanguageStatistics();

  // Aggregate loading state from all queries
  const loading = applicationsQuery.isLoading || statusOptionsQuery.isLoading;

  // Refetch function to refresh all data
  const refetchData = async () => {
    await Promise.all([
      applicationsQuery.refetch(),
      statusOptionsQuery.refetch(),
      languageStatsQuery.refetch(),
    ]);
  };

  return {
    applications: applicationsQuery.data?.applications || [],
    totalCount: applicationsQuery.data?.totalCount || 0,
    statusOptions: statusOptionsQuery.data || ['new', 'reviewing', 'interviewed', 'accepted', 'rejected'],
    languageStats: languageStatsQuery.data?.languageStats || [],
    totalLanguages: languageStatsQuery.data?.totalLanguages || 0,
    allLanguages: languageStatsQuery.data?.allLanguages || [],
    loading,
    error: applicationsQuery.error || statusOptionsQuery.error || languageStatsQuery.error,
    refetchData
  };
}