import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealTimeMetrics {
  activeUsers: number;
  pendingApprovals: number;
  overdueCompliance: number;
  expiringDocuments: number;
  recentActivity: Array<{
    id: string;
    type: 'leave' | 'compliance' | 'document' | 'employee';
    message: string;
    timestamp: string;
  }>;
}

export function useRealTimeAnalytics() {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    activeUsers: 0,
    pendingApprovals: 0,
    overdueCompliance: 0,
    expiringDocuments: 0,
    recentActivity: []
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initial data fetch
    fetchRealTimeMetrics();

    // Set up real-time subscriptions
    const leaveChannel = supabase
      .channel('leave-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leave_requests' },
        (payload) => {
          console.log('Leave request change:', payload);
          handleLeaveChange(payload);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    const complianceChannel = supabase
      .channel('compliance-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'compliance_period_records' },
        (payload) => {
          console.log('Compliance change:', payload);
          handleComplianceChange(payload);
        }
      )
      .subscribe();

    const employeeChannel = supabase
      .channel('employee-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        (payload) => {
          console.log('Employee change:', payload);
          handleEmployeeChange(payload);
        }
      )
      .subscribe();

    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchRealTimeMetrics, 30000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(leaveChannel);
      supabase.removeChannel(complianceChannel);
      supabase.removeChannel(employeeChannel);
    };
  }, []);

  const fetchRealTimeMetrics = async () => {
    try {
      const [pendingLeaves, overdueCompliance, expiringDocs] = await Promise.all([
        // Pending leave approvals
        supabase
          .from('leave_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        
        // Overdue compliance
        supabase
          .from('compliance_period_records')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'overdue'),
        
        // Expiring documents (next 7 days)
        supabase
          .from('document_tracker')
          .select('*', { count: 'exact', head: true })
          .lte('expiry_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .gte('expiry_date', new Date().toISOString().split('T')[0])
      ]);

      // Fetch recent activity
      const recentActivity = await fetchRecentActivity();

      setMetrics({
        activeUsers: Math.floor(Math.random() * 25) + 5, // Simulated for now
        pendingApprovals: pendingLeaves.count || 0,
        overdueCompliance: overdueCompliance.count || 0,
        expiringDocuments: expiringDocs.count || 0,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Get recent leaves
      const { data: recentLeaves } = await supabase
        .from('leave_requests')
        .select('id, status, created_at, employees(name)')
        .order('created_at', { ascending: false })
        .limit(3);

      // Get recent compliance updates
      const { data: recentCompliance } = await supabase
        .from('compliance_period_records')
        .select('id, status, updated_at, employees(name)')
        .order('updated_at', { ascending: false })
        .limit(3);

      const activity: Array<{
        id: string;
        type: 'leave' | 'compliance' | 'document' | 'employee';
        message: string;
        timestamp: string;
      }> = [];

      // Process leave activities
      (recentLeaves || []).forEach(leave => {
        activity.push({
          id: `leave-${leave.id}`,
          type: 'leave' as const,
          message: `Leave request ${leave.status}`,
          timestamp: leave.created_at
        });
      });

      // Process compliance activities
      (recentCompliance || []).forEach(compliance => {
        activity.push({
          id: `compliance-${compliance.id}`,
          type: 'compliance' as const,
          message: `Compliance task ${compliance.status}`,
          timestamp: compliance.updated_at
        });
      });

      // Sort by timestamp and take most recent 5
      return activity
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  };

  const handleLeaveChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setMetrics(prev => {
      const newActivity = [...prev.recentActivity];
      
      if (eventType === 'INSERT') {
        newActivity.unshift({
          id: `leave-${newRecord.id}`,
          type: 'leave' as const,
          message: `New leave request submitted`,
          timestamp: newRecord.created_at
        });
      } else if (eventType === 'UPDATE' && oldRecord.status !== newRecord.status) {
        newActivity.unshift({
          id: `leave-${newRecord.id}`,
          type: 'leave' as const,
          message: `Leave request ${newRecord.status}`,
          timestamp: new Date().toISOString()
        });
      }

      return {
        ...prev,
        recentActivity: newActivity.slice(0, 5),
        pendingApprovals: newRecord?.status === 'pending' ? prev.pendingApprovals + 1 : 
                         oldRecord?.status === 'pending' && newRecord?.status !== 'pending' ? prev.pendingApprovals - 1 : 
                         prev.pendingApprovals
      };
    });
  };

  const handleComplianceChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setMetrics(prev => {
      const newActivity = [...prev.recentActivity];
      
      if (eventType === 'UPDATE' && oldRecord.status !== newRecord.status) {
        newActivity.unshift({
          id: `compliance-${newRecord.id}`,
          type: 'compliance' as const,
          message: `Compliance task ${newRecord.status}`,
          timestamp: new Date().toISOString()
        });
      }

      return {
        ...prev,
        recentActivity: newActivity.slice(0, 5),
        overdueCompliance: newRecord?.status === 'overdue' ? prev.overdueCompliance + 1 :
                          oldRecord?.status === 'overdue' && newRecord?.status !== 'overdue' ? prev.overdueCompliance - 1 :
                          prev.overdueCompliance
      };
    });
  };

  const handleEmployeeChange = (payload: any) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT') {
      setMetrics(prev => ({
        ...prev,
        recentActivity: [{
          id: `employee-${newRecord.id}`,
          type: 'employee' as const,
          message: `${newRecord.name} joined the team`,
          timestamp: newRecord.created_at
        }, ...prev.recentActivity].slice(0, 5)
      }));
    }
  };

  return {
    metrics,
    isConnected,
    refresh: fetchRealTimeMetrics
  };
}