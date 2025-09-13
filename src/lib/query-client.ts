import { QueryClient } from '@tanstack/react-query';

// Create a properly configured QueryClient with caching strategies
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Static reference data (branches, leave types, compliance types)
      staleTime: 30 * 60 * 1000, // 30 minutes
      gcTime: 60 * 60 * 1000, // 1 hour (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Cache time configurations for different data types
export const cacheConfig = {
  // Static reference data - long cache times
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
  // Dynamic user data - medium cache times  
  dynamic: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
  // Real-time data - short cache times
  realtime: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  // Settings data - medium-long cache times
  settings: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
} as const;