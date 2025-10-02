import { QueryClient } from '@tanstack/react-query';

// React Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // TODO: Show toast notification for mutation errors
      },
    },
  },
});

// Query keys factory for better organization and type safety
export const queryKeys = {
  // Auth queries
  auth: ['auth'] as const,
  authUser: () => [...queryKeys.auth, 'user'] as const,
  
  // Task queries
  tasks: ['tasks'] as const,
  tasksList: (filters?: any) => [...queryKeys.tasks, 'list', filters] as const,
  tasksDetail: (taskId: string) => [...queryKeys.tasks, 'detail', taskId] as const,
  tasksStats: (userId: string) => [...queryKeys.tasks, 'stats', userId] as const,
  
  // Tag queries
  tags: ['tags'] as const,
  tagsList: (userId: string) => [...queryKeys.tags, 'list', userId] as const,
  tagsDetail: (tagId: string) => [...queryKeys.tags, 'detail', tagId] as const,
  
  // User queries
  users: ['users'] as const,
  userPreferences: (userId: string) => [...queryKeys.users, 'preferences', userId] as const,
  userProfile: (userId: string) => [...queryKeys.users, 'profile', userId] as const,
  
  // Dashboard queries
  dashboard: ['dashboard'] as const,
  dashboardStats: (userId: string) => [...queryKeys.dashboard, 'stats', userId] as const,
  dashboardRecentTasks: (userId: string) => [...queryKeys.dashboard, 'recent-tasks', userId] as const,
  
  // Notification queries
  notifications: ['notifications'] as const,
  notificationsList: (userId: string) => [...queryKeys.notifications, 'list', userId] as const,
} as const;

// Export types
export type QueryKeys = typeof queryKeys;