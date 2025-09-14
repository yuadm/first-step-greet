import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { leaveQueryKeys } from './queries/useLeaveQueries';
import { employeeQueryKeys } from './queries/useEmployeeQueries';
import { complianceQueryKeys } from './queries/useComplianceQueries';
import { usePrefetching, useBackgroundSync } from './usePrefetching';

/**
 * Hook for activity-based synchronization and smart prefetching
 * Handles background sync, user activity detection, and intelligent prefetching
 */
export function useActivitySync() {
  const queryClient = useQueryClient();
  const { warmupCriticalData, syncOnActivity } = useBackgroundSync();
  
  // Activity detection state
  const handleUserActivity = useCallback(() => {
    // Sync real-time data when user becomes active
    syncOnActivity();
  }, [syncOnActivity]);

  const handleWindowFocus = useCallback(() => {
    // Aggressive sync on window focus for critical data
    queryClient.invalidateQueries({ 
      queryKey: leaveQueryKeys.lists(),
      refetchType: 'active'
    });
    
    queryClient.invalidateQueries({
      queryKey: employeeQueryKeys.lists(), 
      refetchType: 'active'
    });
  }, [queryClient]);

  const handleWindowVisibilityChange = useCallback(() => {
    if (!document.hidden) {
      // Page became visible, sync critical data
      handleWindowFocus();
    }
  }, [handleWindowFocus]);

  // Setup activity listeners
  useEffect(() => {
    // Mouse movement, clicks, keyboard activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    let activityTimeout: NodeJS.Timeout;
    const throttledActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(handleUserActivity, 1000); // Throttle to once per second
    };

    // Window focus/blur events
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('visibilitychange', handleWindowVisibilityChange);
    
    // Activity events  
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledActivity, { passive: true });
    });

    // Initial warmup
    warmupCriticalData();

    return () => {
      clearTimeout(activityTimeout);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('visibilitychange', handleWindowVisibilityChange);
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledActivity);
      });
    };
  }, [handleUserActivity, handleWindowFocus, handleWindowVisibilityChange, warmupCriticalData]);

  return {
    syncNow: handleUserActivity,
    warmupData: warmupCriticalData,
  };
}

/**
 * Hook for route-based prefetching
 * Prefetches data based on current and likely next routes
 */
export function useRoutePrefetching(currentRoute: string) {
  const { smartPrefetch } = usePrefetching();

  useEffect(() => {
    // Prefetch data for current route
    smartPrefetch(currentRoute);

    // Prefetch likely next routes based on common patterns
    const prefetchRelatedRoutes = () => {
      switch (currentRoute) {
        case '/employees':
          // Users often go from employees to leaves or compliance
          smartPrefetch('/leaves');
          smartPrefetch('/compliance');
          break;
        
        case '/leaves':
          // Users often check employee details when viewing leaves
          smartPrefetch('/employees');
          break;
        
        case '/compliance':
          // Users often check employee details for compliance
          smartPrefetch('/employees');
          break;
      }
    };

    // Delay related prefetching to avoid blocking main route
    const timeout = setTimeout(prefetchRelatedRoutes, 2000);
    
    return () => clearTimeout(timeout);
  }, [currentRoute, smartPrefetch]);
}