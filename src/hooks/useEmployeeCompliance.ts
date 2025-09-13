import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ComplianceItem {
  id: string;
  name: string;
  frequency: string;
  period: string;
  status: 'due' | 'completed' | 'overdue';
  isOverdue?: boolean;
}

interface ComplianceData {
  dueItems: ComplianceItem[];
  completedItems: ComplianceItem[];
  loading: boolean;
  error: string | null;
}

export function useEmployeeCompliance(employeeId: string | undefined): ComplianceData {
  const [data, setData] = useState<ComplianceData>({
    dueItems: [],
    completedItems: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!employeeId) return;

    const fetchComplianceData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

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
          // Generate current period identifier based on frequency
          let currentPeriod = '';
          switch (type.frequency) {
            case 'annual':
              currentPeriod = currentYear.toString();
              break;
            case 'quarterly':
              currentPeriod = `${currentYear}-Q${currentQuarter}`;
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

          // Find record for current period
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
            isOverdue: false
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
            // No record exists for current period, so it's due
            dueItems.push(complianceItem);
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

        setData({
          dueItems: dueItems.slice(0, 5), // Limit to 5 most recent
          completedItems: completedItems.slice(0, 5), // Limit to 5 most recent
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching compliance data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch compliance data'
        }));
      }
    };

    fetchComplianceData();
  }, [employeeId]);

  return data;
}