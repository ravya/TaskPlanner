import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { taskService, type TaskPaginationResult } from '../services/firebase/task.service';
import type {
  Task,
  TaskFormData,
  TaskUpdateData,
  TaskFilters,
  TaskSortOptions,
  TaskStatistics,
  BulkTaskOperation,
  BulkOperationType,
  CreateTaskInput,
  UpdateTaskInput,
} from '../types/task';

export interface UseTasksOptions {
  filters?: TaskFilters;
  sortBy?: TaskSortOptions;
  limit?: number;
  enabled?: boolean;
}

export interface UseTasksReturn {
  // Query states
  tasks: Task[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  
  // Actions
  createTask: (data: TaskFormData) => Promise<Task>;
  updateTask: (taskId: string, data: TaskUpdateData) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  archiveTask: (taskId: string) => Promise<void>;
  restoreTask: (taskId: string) => Promise<void>;
  duplicateTask: (taskId: string, data?: Partial<TaskFormData>) => Promise<Task>;
  bulkUpdateTasks: (operation: BulkTaskOperation) => Promise<void>;
  
  // Pagination
  fetchNextPage: () => void;
  refetch: () => void;
  
  // Loading states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isBulkUpdating: boolean;
}

export const useTasks = (options: UseTasksOptions = {}): UseTasksReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const {
    filters = {},
    sortBy = { field: 'updatedAt', direction: 'desc' },
    limit = 20,
    enabled = true,
  } = options;

  const userId = user?.uid;

  // Query key factory
  const getQueryKey = () => ['tasks', 'list', { userId, filters, sortBy, limit }];

  // Fetch tasks with pagination
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useQuery({
    queryKey: getQueryKey(),
    queryFn: ({ pageParam = 0 }) => {
      if (!userId) throw new Error('User not authenticated');
      return taskService.getTasks(userId, {
        filters,
        sortBy,
        limit,
        offset: pageParam * limit,
      });
    },
    enabled: enabled && !!userId,
    getNextPageParam: (lastPage: TaskPaginationResult, pages) => {
      return lastPage.hasNextPage ? pages.length : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Extract tasks from paginated data
  const tasks = data?.pages?.flatMap(page => page.tasks) ?? [];

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: TaskFormData) => {
      if (!userId) throw new Error('User not authenticated');
      
      // Convert TaskFormData to CreateTaskInput
      const createTaskInput: CreateTaskInput = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        category: taskData.category,
        tags: taskData.tags,
        assignedTo: taskData.assignedTo,
        dueDate: taskData.dueDate,
        startDate: taskData.startDate,
        estimatedDuration: taskData.estimatedDuration,
        labels: taskData.labels?.map(name => ({ name, color: '#3B82F6' })) || [],
        reminders: [],
        // Add other mappings as needed
      };
      
      return taskService.createTask(userId, createTaskInput);
    },
    onSuccess: (newTask) => {
      // Optimistically update the cache
      queryClient.setQueryData(getQueryKey(), (old: any) => {
        if (!old) return { 
          pages: [{ 
            tasks: [newTask], 
            hasNextPage: false, 
            totalCount: 1,
            pageInfo: { currentPage: 1, pageSize: limit, totalPages: 1 }
          }] 
        };
        
        const newPages = [...old.pages];
        newPages[0] = {
          ...newPages[0],
          tasks: [newTask, ...newPages[0].tasks],
          totalCount: newPages[0].totalCount + 1,
        };
        
        return { ...old, pages: newPages };
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tasks', 'statistics', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      console.error('Failed to create task:', error);
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: TaskUpdateData }) => {
      if (!userId) throw new Error('User not authenticated');
      
      // Convert TaskUpdateData to UpdateTaskInput
      const updateTaskInput: UpdateTaskInput = {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        category: data.category,
        tags: data.tags,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate,
        startDate: data.startDate,
        estimatedDuration: data.estimatedDuration,
        progress: data.progress,
        labels: data.labels?.map(name => ({ name, color: '#3B82F6' })) || undefined,
      };
      
      return taskService.updateTask(userId, taskId, updateTaskInput);
    },
    onMutate: async ({ taskId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: getQueryKey() });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(getQueryKey());

      // Optimistically update
      queryClient.setQueryData(getQueryKey(), (old: any) => {
        if (!old) return old;

        const newPages = old.pages.map((page: any) => ({
          ...page,
          tasks: page.tasks.map((task: Task) =>
            task.id === taskId ? { ...task, ...data, updatedAt: new Date().toISOString() } : task
          ),
        }));

        return { ...old, pages: newPages };
      });

      return { previousTasks };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(getQueryKey(), context.previousTasks);
      }
      console.error('Failed to update task:', error);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['tasks', 'detail'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'statistics', userId] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => {
      if (!userId) throw new Error('User not authenticated');
      return taskService.deleteTask(userId, taskId);
    },
    onSuccess: (_, taskId) => {
      // Remove from cache
      queryClient.setQueryData(getQueryKey(), (old: any) => {
        if (!old) return old;

        const newPages = old.pages.map((page: any) => ({
          ...page,
          tasks: page.tasks.filter((task: Task) => task.id !== taskId),
          totalCount: Math.max(page.totalCount - 1, 0),
        }));

        return { ...old, pages: newPages };
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'statistics', userId] });
    },
    onError: (error) => {
      console.error('Failed to delete task:', error);
    },
  });

  // Archive task mutation
  const archiveTaskMutation = useMutation({
    mutationFn: (taskId: string) => {
      if (!userId) throw new Error('User not authenticated');
      return taskService.archiveTask(userId, taskId, true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getQueryKey() });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'statistics', userId] });
    },
  });

  // Restore task mutation
  const restoreTaskMutation = useMutation({
    mutationFn: (taskId: string) => {
      if (!userId) throw new Error('User not authenticated');
      return taskService.archiveTask(userId, taskId, false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getQueryKey() });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'statistics', userId] });
    },
  });

  // Duplicate task mutation
  const duplicateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data?: Partial<TaskFormData> }) => {
      if (!userId) throw new Error('User not authenticated');
      return taskService.duplicateTask(userId, taskId, data);
    },
    onSuccess: (newTask) => {
      // Add to cache
      queryClient.setQueryData(getQueryKey(), (old: any) => {
        if (!old) return { 
          pages: [{ 
            tasks: [newTask], 
            hasNextPage: false, 
            totalCount: 1,
            pageInfo: { currentPage: 1, pageSize: limit, totalPages: 1 }
          }] 
        };
        
        const newPages = [...old.pages];
        newPages[0] = {
          ...newPages[0],
          tasks: [newTask, ...newPages[0].tasks],
          totalCount: newPages[0].totalCount + 1,
        };
        
        return { ...old, pages: newPages };
      });
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (operation: BulkTaskOperation) => {
      if (!userId) throw new Error('User not authenticated');
      
      // Map BulkTaskOperation to appropriate service calls
      switch (operation.operation) {
        case BulkOperationType.DELETE:
          return taskService.bulkDeleteTasks(userId, operation.taskIds);
          
        case BulkOperationType.ARCHIVE:
          return taskService.bulkUpdateTasks(userId, operation.taskIds, { isArchived: true });
          
        case BulkOperationType.UPDATE_STATUS:
          return taskService.bulkUpdateTasks(userId, operation.taskIds, { status: operation.data });
          
        case BulkOperationType.UPDATE_PRIORITY:
          return taskService.bulkUpdateTasks(userId, operation.taskIds, { priority: operation.data });
          
        case BulkOperationType.UPDATE_ASSIGNEE:
          return taskService.bulkUpdateTasks(userId, operation.taskIds, { assignedTo: operation.data });
          
        case BulkOperationType.ADD_TAGS:
          // This would need special handling - for now invalidate queries
          queryClient.invalidateQueries({ queryKey: getQueryKey() });
          return Promise.resolve([]);
          
        case BulkOperationType.REMOVE_TAGS:
          // This would need special handling - for now invalidate queries
          queryClient.invalidateQueries({ queryKey: getQueryKey() });
          return Promise.resolve([]);
          
        default:
          throw new Error(`Unsupported bulk operation: ${operation.operation}`);
      }
    },
    onSuccess: () => {
      // Invalidate all task queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      console.error('Failed to bulk update tasks:', error);
    },
  });

  return {
    // Query states
    tasks,
    isLoading,
    isError,
    error,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,

    // Actions
    createTask: createTaskMutation.mutateAsync,
    updateTask: (taskId: string, data: TaskUpdateData) =>
      updateTaskMutation.mutateAsync({ taskId, data }),
    deleteTask: deleteTaskMutation.mutateAsync,
    archiveTask: archiveTaskMutation.mutateAsync,
    restoreTask: restoreTaskMutation.mutateAsync,
    duplicateTask: (taskId: string, data?: Partial<TaskFormData>) =>
      duplicateTaskMutation.mutateAsync({ taskId, data }),
    bulkUpdateTasks: bulkUpdateMutation.mutateAsync,

    // Pagination
    fetchNextPage,
    refetch,

    // Loading states
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending,
  };
};

export default useTasks;