import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import { queryClient } from '../index';

// Query client context and provider setup
export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children,
    // Show devtools only in development
    import.meta.env.DEV && React.createElement(ReactQueryDevtools, {
      initialIsOpen: false,
      position: 'bottom-right',
    })
  );
};

// Common query options
export const commonQueryOptions = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  cacheTime: 1000 * 60 * 10, // 10 minutes
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

// Real-time query options for frequently changing data
export const realTimeQueryOptions = {
  ...commonQueryOptions,
  staleTime: 0, // Always fresh
  cacheTime: 1000 * 60 * 2, // 2 minutes
  refetchInterval: 1000 * 30, // 30 seconds
};

// Offline-first query options
export const offlineQueryOptions = {
  ...commonQueryOptions,
  staleTime: Infinity, // Never stale
  cacheTime: Infinity, // Never garbage collected
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  networkMode: 'offlineFirst' as const,
};

// Error handling utilities
export const handleQueryError = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  
  if (error?.code) {
    const errorMessages: Record<string, string> = {
      'permission-denied': 'You do not have permission to access this data',
      'not-found': 'The requested data was not found',
      'unavailable': 'Service is temporarily unavailable',
      'unauthenticated': 'Please sign in to continue',
      'network-error': 'Network connection error',
    };
    
    return errorMessages[error.code] || 'An unexpected error occurred';
  }
  
  return 'An unexpected error occurred';
};

// Query invalidation utilities
export const invalidateQueries = {
  // Invalidate all task-related queries
  tasks: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats', userId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'recent-tasks', userId] });
  },
  
  // Invalidate specific task queries
  task: (taskId: string) => {
    queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', taskId] });
    queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] });
  },
  
  // Invalidate all tag-related queries
  tags: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Tasks contain tags
  },
  
  // Invalidate user-related queries
  user: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['users', 'preferences', userId] });
    queryClient.invalidateQueries({ queryKey: ['users', 'profile', userId] });
  },
  
  // Invalidate dashboard queries
  dashboard: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats', userId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'recent-tasks', userId] });
  },
  
  // Invalidate all queries for a user
  allUserData: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['users', 'preferences', userId] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  },
};

// Cache management utilities
export const cacheUtils = {
  // Clear all cache
  clearAll: () => {
    queryClient.clear();
  },
  
  // Clear cache for a specific user
  clearUserCache: (userId: string) => {
    queryClient.removeQueries({ queryKey: ['tasks'] });
    queryClient.removeQueries({ queryKey: ['tags'] });
    queryClient.removeQueries({ queryKey: ['dashboard'] });
    queryClient.removeQueries({ queryKey: ['users', 'preferences', userId] });
    queryClient.removeQueries({ queryKey: ['notifications'] });
  },
  
  // Prefetch common data
  prefetchUserData: async (userId: string) => {
    // Prefetch tasks
    queryClient.prefetchQuery({
      queryKey: ['tasks', 'list', { userId }],
      staleTime: commonQueryOptions.staleTime,
    });
    
    // Prefetch tags
    queryClient.prefetchQuery({
      queryKey: ['tags', 'list', userId],
      staleTime: commonQueryOptions.staleTime,
    });
    
    // Prefetch dashboard stats
    queryClient.prefetchQuery({
      queryKey: ['dashboard', 'stats', userId],
      staleTime: commonQueryOptions.staleTime,
    });
  },
  
  // Get cached data without triggering a request
  getCachedTasks: (userId: string, filters?: any) => {
    return queryClient.getQueryData(['tasks', 'list', { userId, ...filters }]);
  },
  
  getCachedTask: (taskId: string) => {
    return queryClient.getQueryData(['tasks', 'detail', taskId]);
  },
  
  getCachedTags: (userId: string) => {
    return queryClient.getQueryData(['tags', 'list', userId]);
  },
  
  // Set cached data manually
  setCachedTask: (taskId: string, task: any) => {
    queryClient.setQueryData(['tasks', 'detail', taskId], task);
    
    // Also update the task in lists
    const listQueries = queryClient.getQueryCache().findAll({
      queryKey: ['tasks', 'list'],
      type: 'active',
    });
    
    listQueries.forEach((query) => {
      const currentData = query.state.data as any;
      if (currentData?.data) {
        const updatedData = {
          ...currentData,
          data: currentData.data.map((t: any) => t.id === taskId ? task : t),
        };
        queryClient.setQueryData(query.queryKey, updatedData);
      }
    });
  },
};

// Optimistic updates utilities
export const optimisticUpdates = {
  // Optimistically update a task
  updateTask: (taskId: string, updates: any) => {
    // Update task detail
    queryClient.setQueryData(['tasks', 'detail', taskId], (old: any) => {
      return old ? { ...old, ...updates } : null;
    });
    
    // Update task in lists
    const listQueries = queryClient.getQueryCache().findAll({
      queryKey: ['tasks', 'list'],
      type: 'active',
    });
    
    listQueries.forEach((query) => {
      queryClient.setQueryData(query.queryKey, (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.map((task: any) => 
            task.id === taskId ? { ...task, ...updates } : task
          ),
        };
      });
    });
  },
  
  // Optimistically add a new task
  addTask: (task: any) => {
    // Add to all matching task lists
    const listQueries = queryClient.getQueryCache().findAll({
      queryKey: ['tasks', 'list'],
      type: 'active',
    });
    
    listQueries.forEach((query) => {
      queryClient.setQueryData(query.queryKey, (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: [task, ...old.data],
          total: (old.total || 0) + 1,
        };
      });
    });
  },
  
  // Optimistically remove a task
  removeTask: (taskId: string) => {
    // Remove from task detail
    queryClient.removeQueries({ queryKey: ['tasks', 'detail', taskId] });
    
    // Remove from task lists
    const listQueries = queryClient.getQueryCache().findAll({
      queryKey: ['tasks', 'list'],
      type: 'active',
    });
    
    listQueries.forEach((query) => {
      queryClient.setQueryData(query.queryKey, (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.filter((task: any) => task.id !== taskId),
          total: Math.max((old.total || 0) - 1, 0),
        };
      });
    });
  },
};

// Background refetch utilities
export const backgroundRefetch = {
  // Refetch all active queries
  refetchAll: () => {
    queryClient.refetchQueries({ type: 'active' });
  },
  
  // Refetch specific query types
  refetchTasks: () => {
    queryClient.refetchQueries({ queryKey: ['tasks'] });
  },
  
  refetchTags: () => {
    queryClient.refetchQueries({ queryKey: ['tags'] });
  },
  
  refetchDashboard: (userId: string) => {
    queryClient.refetchQueries({ queryKey: ['dashboard', 'stats', userId] });
    queryClient.refetchQueries({ queryKey: ['dashboard', 'recent-tasks', userId] });
  },
  
  // Refetch stale queries
  refetchStale: () => {
    queryClient.refetchQueries({ stale: true });
  },
};

// Export the configured query client
export { queryClient };
export default QueryProvider;