import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cacheConfig } from '@/lib/query-client';
import { employeeDashboardQueryKeys } from './queries/useEmployeeDashboardQueries';

interface ComplianceItem {
  id: string;
  name: string;
  frequency: string;
  period: string;
  status: 'due' | 'completed' | 'overdue';
  isOverdue?: boolean;
  completedDate?: string;
  quarterlyTimeline?: QuarterlyPeriod[];
}

interface QuarterlyPeriod {
  quarter: number;
  period: string;
  label: string;
  status: 'completed' | 'due' | 'upcoming';
  completedDate?: string;
}

interface ComplianceData {
  dueItems: ComplianceItem[];
  completedItems: ComplianceItem[];
  loading: boolean;
  error: string | null;
}

// Fetch employee compliance data
async function fetchEmployeeCompliance(employeeId: string): Promise<ComplianceData> {
  try {
    // Get all compliance types for employees
    const { data: complianceTypes, error: typesError } = await supabase
      .from('compliance_types')
      .select('*')
      .eq('target_table', 'employees');

    if (typesError) throw typesError;

    // Get employee's compliance records
    const { data: complianceRecords, error: recordsError } = await supabase
      .from('compliance_period_records')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (recordsError) throw recordsError;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);

    const dueItems: ComplianceItem[] = [];
    const completedItems: ComplianceItem[] = [];

    // Process each compliance type
    complianceTypes?.forEach(type => {
      if (type.frequency === 'quarterly') {
        // For quarterly items, create timeline view
        const quarterlyTimeline: QuarterlyPeriod[] = [];
        
        for (let q = 1; q <= 4; q++) {
          const quarterPeriod = `${currentYear}-Q${q}`;
          const record = complianceRecords?.find(
            r => r.compliance_type_id === type.id && r.period_identifier === quarterPeriod
          );

          const quarterLabels = {
            1: 'Q1 Jan to Mar',
            2: 'Q2 Apr to Jun', 
            3: 'Q3 Jul to Sep',
            4: 'Q4 Oct to Dec'
          };

          let status: 'completed' | 'due' | 'upcoming';
          if (q < currentQuarter) {
            status = record?.status === 'completed' ? 'completed' : 'due';
          } else if (q === currentQuarter) {
            status = record?.status === 'completed' ? 'completed' : 'due';
          } else {
            status = 'upcoming';
          }

          quarterlyTimeline.push({
            quarter: q,
            period: quarterPeriod,
            label: quarterLabels[q as keyof typeof quarterLabels],
            status,
            completedDate: record?.updated_at
          });
        }

        // Find the current quarter's status
        const currentQuarterRecord = complianceRecords?.find(
          record => record.compliance_type_id === type.id && 
          record.period_identifier === `${currentYear}-Q${currentQuarter}`
        );

        const complianceItem: ComplianceItem = {
          id: type.id,
          name: type.name,
          frequency: type.frequency,
          period: `${currentYear}-Q${currentQuarter}`,
          status: currentQuarterRecord?.status === 'completed' ? 'completed' : 'due',
          isOverdue: currentQuarterRecord?.is_overdue || false,
          completedDate: currentQuarterRecord?.updated_at,
          quarterlyTimeline
        };

        if (currentQuarterRecord?.status === 'completed') {
          completedItems.push(complianceItem);
        } else {
          dueItems.push(complianceItem);
        }
      } else {
        // Handle non-quarterly items as before
        let currentPeriod = '';
        switch (type.frequency) {
          case 'annual':
            currentPeriod = currentYear.toString();
            break;
          case 'monthly':
            currentPeriod = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
            break;
          case 'bi-annual':
            const halfYear = currentMonth <= 6 ? 1 : 2;
            currentPeriod = `${currentYear}-H${halfYear}`;
            break;
          default:
            currentPeriod = currentYear.toString();
        }

        const currentRecord = complianceRecords?.find(
          record => record.compliance_type_id === type.id && 
          record.period_identifier === currentPeriod
        );

        const complianceItem: ComplianceItem = {
          id: type.id,
          name: type.name,
          frequency: type.frequency,
          period: currentPeriod,
          status: 'due',
          isOverdue: false,
          completedDate: currentRecord?.updated_at
        };

        if (currentRecord) {
          if (currentRecord.status === 'completed') {
            complianceItem.status = 'completed';
            completedItems.push(complianceItem);
          } else if (currentRecord.status === 'overdue' || currentRecord.is_overdue) {
            complianceItem.status = 'overdue';
            complianceItem.isOverdue = true;
            dueItems.push(complianceItem);
          } else {
            complianceItem.status = 'due';
            dueItems.push(complianceItem);
          }
        } else {
          dueItems.push(complianceItem);
        }
      }
    });

    // Also get recently completed items from previous periods (last 3 months)
    const recentCompleted = complianceRecords?.filter(record => {
      if (record.status !== 'completed') return false;
      const recordDate = new Date(record.updated_at);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return recordDate >= threeMonthsAgo;
    });

    recentCompleted?.forEach(record => {
      const type = complianceTypes?.find(t => t.id === record.compliance_type_id);
      if (type && !completedItems.find(item => item.id === type.id && item.period === record.period_identifier)) {
        completedItems.push({
          id: type.id,
          name: type.name,
          frequency: type.frequency,
          period: record.period_identifier,
          status: 'completed'
        });
      }
    });

    return {
      dueItems: dueItems.slice(0, 5), // Limit to 5 most recent
      completedItems: completedItems.slice(0, 5), // Limit to 5 most recent
      loading: false,
      error: null
    };
  } catch (error) {
    console.error('Error fetching compliance data:', error);
    throw error;
  }
}

// React Query hook for employee compliance
export function useEmployeeCompliance(employeeId: string | undefined): ComplianceData {
  const { data, isLoading, error } = useQuery({
    queryKey: employeeDashboardQueryKeys.compliance(employeeId || ''),
    queryFn: () => fetchEmployeeCompliance(employeeId || ''),
    ...cacheConfig.realtime, // Real-time data with 1min stale time, 2min background sync
    enabled: !!employeeId,
  });

  return {
    dueItems: data?.dueItems || [],
    completedItems: data?.completedItems || [],
    loading: isLoading,
    error: error?.message || null
  };
}