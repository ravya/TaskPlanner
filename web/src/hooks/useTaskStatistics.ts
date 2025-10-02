import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { taskService } from '../services/firebase/task.service';
import type { TaskStatistics, TaskFilters } from '../types/task';

export interface UseTaskStatisticsOptions {
  filters?: TaskFilters;
  enabled?: boolean;
}

export interface UseTaskStatisticsReturn {
  statistics: TaskStatistics | undefined;
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => void;
}

export const useTaskStatistics = (options: UseTaskStatisticsOptions = {}): UseTaskStatisticsReturn => {
  const { user } = useAuth();
  const { filters, enabled = true } = options;
  
  const userId = user?.uid;

  const {
    data: statistics,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks', 'statistics', userId, filters],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return taskService.getTaskStatistics(userId, filters);
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    statistics,
    isLoading,
    isError,
    error,
    refetch,
  };
};

export default useTaskStatistics;