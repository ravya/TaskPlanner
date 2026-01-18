import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  increment,
  Query,
  DocumentSnapshot,
  FirestoreError,
  CollectionReference,
  QueryDocumentSnapshot,
  getCountFromServer,
} from 'firebase/firestore';
import { db, auth } from './config';
import {
  TaskStatus,
  TaskPriority,
  TaskSortField,
  TaskMode,
  TASK_LIMITS,
} from '../../types/task';
import type {
  Task,
  TaskFilters,
  TaskSortOptions,
  CreateTaskInput,
  UpdateTaskInput,
  BulkUpdateInput,
  TaskStatistics,

} from '../../types/task';

// Custom error type
export class TaskServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: FirestoreError
  ) {
    super(message);
    this.name = 'TaskServiceError';
  }
}

// Pagination result interface
export interface TaskPaginationResult {
  tasks: Task[];
  totalCount: number;
  hasNextPage: boolean;
  lastDocId?: string;
  pageInfo: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
  };
}

// Query options interface
export interface TaskQueryOptions {
  filters?: TaskFilters;
  sortBy?: TaskSortOptions;
  limit?: number;
  offset?: number;
  lastDocId?: string;
  includeArchived?: boolean;
  includeDeleted?: boolean;
}

class TaskService {
  /**
   * Get user's tasks collection reference
   */
  private getUserTasksRef(userId: string): CollectionReference {
    return collection(db, 'users', userId, 'tasks');
  }

  /**
   * Create a new task
   */
  async createTask(userId: string, taskData: CreateTaskInput): Promise<Task> {
    try {
      const tasksRef = this.getUserTasksRef(userId);

      // Check verification status for limits
      const currentUser = auth.currentUser;
      const isGoogleUser = currentUser?.providerData.some((p: any) => p.providerId === 'google.com');
      const isVerified = currentUser?.emailVerified || isGoogleUser;

      if (!isVerified) {
        // Enforce task limit
        const stats = await this.getTaskStatistics(userId);
        if (stats.total >= TASK_LIMITS.MAX_TASKS_UNVERIFIED) {
          throw new TaskServiceError(
            `Unverified accounts are limited to ${TASK_LIMITS.MAX_TASKS_UNVERIFIED} tasks. Please verify your email to create more.`,
            'TASK_LIMIT_EXCEEDED'
          );
        }

        // Disable recurring tasks for unverified
        if (taskData.isRepeating) {
          throw new TaskServiceError(
            'Recurring tasks are a premium feature available to verified accounts. Please verify your email to use this feature.',
            'VERIFICATION_REQUIRED'
          );
        }
      }

      const now = new Date().toISOString();
      const newTask: Omit<Task, 'id'> = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || TaskStatus.TODO,
        priority: taskData.priority || TaskPriority.MEDIUM,
        category: taskData.category,
        tags: taskData.tags || [],
        assignedTo: taskData.assignedTo,
        assignedBy: taskData.assignedBy,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        dueDate: taskData.dueDate,
        startDate: taskData.startDate,
        completedAt: undefined,
        estimatedDuration: taskData.estimatedDuration,
        actualDuration: undefined,
        progress: taskData.progress || 0,
        attachments: [],
        subtasks: [],
        comments: [],
        reminders: taskData.reminders || [],
        labels: taskData.labels || [],
        metadata: {
          source: 'web',
          version: 1,
          lastModifiedBy: userId,
          ...taskData.metadata,
        },
        isArchived: false,
        isDeleted: false,
        parentTaskId: taskData.parentTaskId,
        position: taskData.position || 0,
        boardId: taskData.boardId,
        listId: taskData.listId,
        mode: taskData.mode || TaskMode.PERSONAL, // default to personal
      };

      const docRef = await addDoc(tasksRef, {
        ...newTask,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        ...newTask,
      };
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to create task');
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(userId: string, taskId: string, updates: UpdateTaskInput): Promise<Task> {
    try {
      const taskRef = doc(this.getUserTasksRef(userId), taskId);

      // Get current task
      const currentTask = await getDoc(taskRef);
      if (!currentTask.exists()) {
        throw new TaskServiceError('Task not found');
      }

      const currentData = currentTask.data() as Task;

      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
        'metadata.version': increment(1),
        'metadata.lastModifiedBy': userId,
      };

      // Handle status changes
      if (updates.status === TaskStatus.COMPLETED && currentData.status !== TaskStatus.COMPLETED) {
        updateData.completedAt = serverTimestamp();
        updateData.progress = 100;
      } else if (updates.status !== TaskStatus.COMPLETED && currentData.status === TaskStatus.COMPLETED) {
        updateData.completedAt = null;
      }

      // Handle progress updates
      if (updates.progress !== undefined) {
        if (updates.progress === 100 && currentData.status !== TaskStatus.COMPLETED) {
          updateData.status = TaskStatus.COMPLETED;
          updateData.completedAt = serverTimestamp();
        } else if (updates.progress < 100 && currentData.status === TaskStatus.COMPLETED) {
          updateData.status = TaskStatus.IN_PROGRESS;
          updateData.completedAt = null;
        }
      }

      await updateDoc(taskRef, updateData);

      // Return updated task
      return await this.getTask(userId, taskId);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to update task');
    }
  }

  /**
   * Get a single task by ID
   */
  async getTask(userId: string, taskId: string): Promise<Task> {
    try {
      const taskRef = doc(this.getUserTasksRef(userId), taskId);
      const taskSnapshot = await getDoc(taskRef);

      if (!taskSnapshot.exists()) {
        throw new TaskServiceError('Task not found');
      }

      return this.mapDocumentToTask(taskSnapshot);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to get task');
    }
  }

  /**
   * Get tasks with filtering, sorting, and pagination
   */
  async getTasks(userId: string, options: TaskQueryOptions = {}): Promise<TaskPaginationResult> {
    try {
      const {
        filters = {},
        sortBy = { field: TaskSortField.UPDATED_AT, direction: 'desc' },
        limit: pageSize = 20,
        offset = 0,
        lastDocId,
        includeArchived = false,
        includeDeleted = false,
      } = options;

      let q: Query = collection(db, 'users', userId, 'tasks');

      // Apply base filters
      if (!includeDeleted) {
        q = query(q, where('isDeleted', '==', false));
      }
      if (!includeArchived && !filters.isArchived) {
        q = query(q, where('isArchived', '==', false));
      }

      // Apply custom filters
      q = this.applyFilters(q, filters);

      // Apply sorting
      const sortField = this.mapSortField(sortBy.field);
      q = query(q, orderBy(sortField, sortBy.direction));

      // Get total count (before pagination)
      const countSnapshot = await getCountFromServer(q);
      const totalCount = countSnapshot.data().count;

      // Apply pagination
      if (lastDocId) {
        const lastDoc = await getDoc(doc(this.getUserTasksRef(userId), lastDocId));
        if (lastDoc.exists()) {
          q = query(q, startAfter(lastDoc));
        }
      } else if (offset > 0) {
        q = query(q, limit(offset));
      }

      q = query(q, limit(pageSize + 1)); // +1 to check if there are more

      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs
        .slice(0, pageSize)
        .map(doc => this.mapDocumentToTask(doc));

      const hasNextPage = querySnapshot.docs.length > pageSize;
      const currentPage = Math.floor(offset / pageSize) + 1;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        tasks,
        totalCount,
        hasNextPage,
        lastDocId: tasks.length > 0 ? tasks[tasks.length - 1].id : undefined,
        pageInfo: {
          currentPage,
          pageSize,
          totalPages,
        },
      };
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to get tasks');
    }
  }

  /**
   * Delete a task (soft delete)
   */
  async deleteTask(userId: string, taskId: string): Promise<void> {
    try {
      const taskRef = doc(this.getUserTasksRef(userId), taskId);

      await updateDoc(taskRef, {
        isDeleted: true,
        updatedAt: serverTimestamp(),
        'metadata.version': increment(1),
        'metadata.lastModifiedBy': userId,
      });
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to delete task');
    }
  }

  /**
   * Permanently delete a task
   */
  async permanentlyDeleteTask(userId: string, taskId: string): Promise<void> {
    try {
      const taskRef = doc(this.getUserTasksRef(userId), taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to permanently delete task');
    }
  }

  /**
   * Archive/unarchive a task
   */
  async archiveTask(userId: string, taskId: string, archived: boolean = true): Promise<Task> {
    try {
      const taskRef = doc(this.getUserTasksRef(userId), taskId);

      await updateDoc(taskRef, {
        isArchived: archived,
        updatedAt: serverTimestamp(),
        'metadata.version': increment(1),
        'metadata.lastModifiedBy': userId,
      });

      return await this.getTask(userId, taskId);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to archive task');
    }
  }

  /**
   * Duplicate a task
   */
  async duplicateTask(userId: string, taskId: string, updates?: Partial<CreateTaskInput>): Promise<Task> {
    try {
      const originalTask = await this.getTask(userId, taskId);

      const duplicateData: CreateTaskInput = {
        title: updates?.title || `${originalTask.title} (Copy)`,
        description: originalTask.description,
        status: updates?.status || TaskStatus.TODO,
        priority: updates?.priority || originalTask.priority,
        category: updates?.category || originalTask.category,
        tags: updates?.tags || [...originalTask.tags],
        assignedTo: updates?.assignedTo || originalTask.assignedTo,
        dueDate: updates?.dueDate || originalTask.dueDate,
        startDate: updates?.startDate || originalTask.startDate,
        estimatedDuration: updates?.estimatedDuration || originalTask.estimatedDuration,
        labels: updates?.labels || [...originalTask.labels],
        reminders: updates?.reminders || [...originalTask.reminders],
        parentTaskId: updates?.parentTaskId || originalTask.parentTaskId,
        boardId: updates?.boardId || originalTask.boardId,
        listId: updates?.listId || originalTask.listId,
        ...updates,
      };

      return await this.createTask(userId, duplicateData);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to duplicate task');
    }
  }

  /**
   * Bulk update multiple tasks
   */
  async bulkUpdateTasks(userId: string, taskIds: string[], updates: BulkUpdateInput): Promise<Task[]> {
    try {
      const batch = writeBatch(db);
      const tasksRef = this.getUserTasksRef(userId);

      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
        'metadata.version': increment(1),
        'metadata.lastModifiedBy': userId,
      };

      taskIds.forEach(taskId => {
        const taskRef = doc(tasksRef, taskId);
        batch.update(taskRef, updateData);
      });

      await batch.commit();

      // Return updated tasks
      return await Promise.all(
        taskIds.map(taskId => this.getTask(userId, taskId))
      );
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to bulk update tasks');
    }
  }

  /**
   * Bulk delete multiple tasks
   */
  async bulkDeleteTasks(userId: string, taskIds: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const tasksRef = this.getUserTasksRef(userId);

      taskIds.forEach(taskId => {
        const taskRef = doc(tasksRef, taskId);
        batch.update(taskRef, {
          isDeleted: true,
          updatedAt: serverTimestamp(),
          'metadata.version': increment(1),
          'metadata.lastModifiedBy': userId,
        });
      });

      await batch.commit();
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to bulk delete tasks');
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(userId: string, filters?: TaskFilters): Promise<TaskStatistics> {
    try {
      const tasksQuery = filters
        ? this.applyFilters(query(this.getUserTasksRef(userId)), filters)
        : query(this.getUserTasksRef(userId), where('isDeleted', '==', false));

      const tasksSnapshot = await getDocs(tasksQuery);
      const tasks = tasksSnapshot.docs.map(doc => this.mapDocumentToTask(doc));

      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: TaskStatistics = {
        total: tasks.length,
        completed: tasks.filter(task => task.status === TaskStatus.COMPLETED).length,
        inProgress: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
        todo: tasks.filter(task => task.status === TaskStatus.TODO).length,
        overdue: tasks.filter(task => {
          if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false;
          return new Date(task.dueDate) < new Date();
        }).length,
        dueSoon: tasks.filter(task => {
          if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false;
          const dueDate = new Date(task.dueDate);
          const threeDaysFromNow = new Date();
          threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
          return dueDate <= threeDaysFromNow && dueDate >= new Date();
        }).length,
        byPriority: {
          [TaskPriority.URGENT]: tasks.filter(task => task.priority === TaskPriority.URGENT).length,
          [TaskPriority.HIGHEST]: tasks.filter(task => task.priority === TaskPriority.HIGHEST).length,
          [TaskPriority.HIGH]: tasks.filter(task => task.priority === TaskPriority.HIGH).length,
          [TaskPriority.MEDIUM]: tasks.filter(task => task.priority === TaskPriority.MEDIUM).length,
          [TaskPriority.LOW]: tasks.filter(task => task.priority === TaskPriority.LOW).length,
          [TaskPriority.LOWEST]: tasks.filter(task => task.priority === TaskPriority.LOWEST).length,
        },
        byStatus: {
          [TaskStatus.TODO]: tasks.filter(task => task.status === TaskStatus.TODO).length,
          [TaskStatus.IN_PROGRESS]: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
          [TaskStatus.IN_REVIEW]: tasks.filter(task => task.status === TaskStatus.IN_REVIEW).length,
          [TaskStatus.BLOCKED]: tasks.filter(task => task.status === TaskStatus.BLOCKED).length,
          [TaskStatus.COMPLETED]: tasks.filter(task => task.status === TaskStatus.COMPLETED).length,
          [TaskStatus.CANCELLED]: tasks.filter(task => task.status === TaskStatus.CANCELLED).length,
          [TaskStatus.ON_HOLD]: tasks.filter(task => task.status === TaskStatus.ON_HOLD).length,
        },
        completionRate: tasks.length > 0 ? (tasks.filter(task => task.status === TaskStatus.COMPLETED).length / tasks.length) * 100 : 0,
        averageCompletionTime: this.calculateAvgCompletionTime(tasks),
        byCategory: {}, // Not implemented yet
        byAssignee: {}, // Not implemented yet

        productivity: {
          today: tasks.filter(task =>
            task.status === TaskStatus.COMPLETED &&
            task.completedAt &&
            new Date(task.completedAt).toDateString() === new Date().toDateString()
          ).length,
          thisWeek: tasks.filter(task =>
            task.status === TaskStatus.COMPLETED &&
            task.completedAt &&
            new Date(task.completedAt) >= startOfWeek
          ).length,
          thisMonth: tasks.filter(task =>
            task.status === TaskStatus.COMPLETED &&
            task.completedAt &&
            new Date(task.completedAt) >= startOfMonth
          ).length,
          averageTasksPerWeek: this.calculateAverageTasksPerWeek(tasks),
          streakDays: this.calculateStreakDays(tasks),
        },
      };

      return stats;
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to get task statistics');
    }
  }

  /**
   * Subscribe to real-time task updates
   */
  subscribeToTasks(
    userId: string,
    callback: (tasks: Task[]) => void,
    options: TaskQueryOptions = {}
  ): () => void {
    try {
      const {
        filters = {},
        sortBy = { field: TaskSortField.UPDATED_AT, direction: 'desc' },
        limit: pageSize = 50,
        includeArchived = false,
        includeDeleted = false,
      } = options;

      let q: Query = collection(db, 'users', userId, 'tasks');

      // Apply base filters
      if (!includeDeleted) {
        q = query(q, where('isDeleted', '==', false));
      }
      if (!includeArchived && !filters.isArchived) {
        q = query(q, where('isArchived', '==', false));
      }

      // Apply custom filters
      q = this.applyFilters(q, filters);

      // Apply sorting
      const sortField = this.mapSortField(sortBy.field);
      q = query(q, orderBy(sortField, sortBy.direction));

      // Apply limit
      if (pageSize) {
        q = query(q, limit(pageSize));
      }

      return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(doc => this.mapDocumentToTask(doc));
        callback(tasks);
      });
    } catch (error) {
      console.error('Failed to subscribe to tasks:', error);
      return () => { }; // Return empty unsubscribe function
    }
  }

  /**
   * Apply filters to a Firestore query
   */
  private applyFilters(q: Query, filters: TaskFilters): Query {
    let filteredQuery = q;

    if (filters.status && filters.status.length > 0) {
      filteredQuery = query(filteredQuery, where('status', 'in', filters.status));
    }

    if (filters.priority && filters.priority.length > 0) {
      filteredQuery = query(filteredQuery, where('priority', 'in', filters.priority));
    }

    if (filters.category) {
      filteredQuery = query(filteredQuery, where('category', '==', filters.category));
    }

    if (filters.assignedTo && filters.assignedTo.length > 0) {
      filteredQuery = query(filteredQuery, where('assignedTo', 'in', filters.assignedTo));
    }

    if (filters.createdBy && filters.createdBy.length > 0) {
      filteredQuery = query(filteredQuery, where('createdBy', 'in', filters.createdBy));
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredQuery = query(filteredQuery, where('tags', 'array-contains-any', filters.tags));
    }

    if (filters.dueDate) {
      if (filters.dueDate.start) {
        filteredQuery = query(filteredQuery, where('dueDate', '>=', filters.dueDate.start));
      }
      if (filters.dueDate.end) {
        filteredQuery = query(filteredQuery, where('dueDate', '<=', filters.dueDate.end));
      }
    }

    if (filters.createdAt) {
      if (filters.createdAt.start) {
        filteredQuery = query(filteredQuery, where('createdAt', '>=', filters.createdAt.start));
      }
      if (filters.createdAt.end) {
        filteredQuery = query(filteredQuery, where('createdAt', '<=', filters.createdAt.end));
      }
    }

    if (filters.isArchived !== undefined) {
      filteredQuery = query(filteredQuery, where('isArchived', '==', filters.isArchived));
    }

    if (filters.hasAttachments !== undefined) {
      if (filters.hasAttachments) {
        filteredQuery = query(filteredQuery, where('attachments', '!=', []));
      }
    }

    if (filters.hasSubtasks !== undefined) {
      if (filters.hasSubtasks) {
        filteredQuery = query(filteredQuery, where('subtasks', '!=', []));
      }
    }

    if (filters.mode && filters.mode.length > 0) {
      filteredQuery = query(filteredQuery, where('mode', 'in', filters.mode));
    }

    return filteredQuery;
  }

  /**
   * Map TaskSortField to Firestore field name
   */
  private mapSortField(field: TaskSortField): string {
    const fieldMap: Record<TaskSortField, string> = {
      [TaskSortField.TITLE]: 'title',
      [TaskSortField.CREATED_AT]: 'createdAt',
      [TaskSortField.UPDATED_AT]: 'updatedAt',
      [TaskSortField.DUE_DATE]: 'dueDate',
      [TaskSortField.PRIORITY]: 'priority',
      [TaskSortField.STATUS]: 'status',
      [TaskSortField.PROGRESS]: 'progress',
      [TaskSortField.POSITION]: 'position',
    };

    return fieldMap[field] || 'updatedAt';
  }

  /**
   * Calculate average completion time in hours
   */
  private calculateAvgCompletionTime(tasks: Task[]): number {
    const completedTasks = tasks.filter(task =>
      task.status === TaskStatus.COMPLETED && task.completedAt
    );

    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((acc, task) => {
      const created = new Date(task.createdAt);
      const completed = new Date(task.completedAt!);
      return acc + (completed.getTime() - created.getTime());
    }, 0);

    return totalTime / completedTasks.length / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Calculate tasks per day
   */


  /**
   * Calculate average tasks per week
   */
  private calculateAverageTasksPerWeek(tasks: Task[]): number {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentCompletedTasks = tasks.filter(task =>
      task.status === TaskStatus.COMPLETED &&
      task.completedAt &&
      new Date(task.completedAt) >= thirtyDaysAgo
    );

    return (recentCompletedTasks.length / 30) * 7; // Tasks per week
  }

  /**
   * Calculate streak days
   */
  private calculateStreakDays(tasks: Task[]): number {
    const completedTasks = tasks.filter(task =>
      task.status === TaskStatus.COMPLETED && task.completedAt
    );

    if (completedTasks.length === 0) return 0;

    const completionDates = Array.from(new Set(
      completedTasks.map(task =>
        new Date(task.completedAt!).toDateString()
      )
    )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    let currentDate = new Date(today); // Start checking from today

    // Check if there's a completion today
    const hasCompletionToday = completionDates.includes(today.toDateString());

    // If no completion today, check if there was one yesterday to keep streak alive
    if (!hasCompletionToday) {
      currentDate.setDate(currentDate.getDate() - 1); // Move to yesterday
      const yesterday = currentDate.toDateString();
      if (!completionDates.includes(yesterday)) {
        return 0; // No completion today or yesterday, streak is 0
      }
    }

    // Now, iterate backwards from currentDate to find consecutive days
    for (let i = 0; i < completionDates.length; i++) {
      const checkDateStr = currentDate.toDateString();
      if (completionDates.includes(checkDateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1); // Move to the previous day
      } else {
        // If the current day is not in completionDates, the streak is broken
        break;
      }
    }

    return streak;
  }


  /**
   * Map Firestore document to Task
   */
  private mapDocumentToTask(doc: DocumentSnapshot | QueryDocumentSnapshot): Task {
    const data = doc.data()!;

    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      category: data.category,
      tags: data.tags || [],
      assignedTo: data.assignedTo,
      assignedBy: data.assignedBy,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      dueDate: data.dueDate,
      startDate: data.startDate,
      completedAt: data.completedAt?.toDate?.() ? data.completedAt.toDate().toISOString() : data.completedAt,
      estimatedDuration: data.estimatedDuration,
      actualDuration: data.actualDuration,
      progress: data.progress || 0,
      attachments: data.attachments || [],
      subtasks: data.subtasks || [],
      comments: data.comments || [],
      reminders: data.reminders || [],
      labels: data.labels || [],
      metadata: data.metadata || {
        source: 'web',
        version: 1,
        lastModifiedBy: data.createdBy,
      },
      isArchived: data.isArchived || false,
      isDeleted: data.isDeleted || false,
      parentTaskId: data.parentTaskId,
      position: data.position || 0,
      boardId: data.boardId,
      listId: data.listId,
      mode: data.mode || TaskMode.PERSONAL, // backward compatibility - default to personal
    };
  }

  /**
   * Handle and transform Firestore errors
   */
  private handleFirestoreError(error: FirestoreError, defaultMessage: string): TaskServiceError {
    const errorMessages: Record<string, string> = {
      'permission-denied': 'You do not have permission to perform this action',
      'not-found': 'The requested task was not found',
      'already-exists': 'A task with this ID already exists',
      'failed-precondition': 'The operation failed due to a conflict',
      'aborted': 'The operation was aborted',
      'out-of-range': 'The operation is out of range',
      'unimplemented': 'This operation is not implemented',
      'internal': 'Internal server error occurred',
      'unavailable': 'The service is currently unavailable',
      'data-loss': 'Unrecoverable data loss or corruption',
      'unauthenticated': 'Authentication is required',
    };

    const message = errorMessages[error.code] || defaultMessage;

    console.error('Task Service Error:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });

    return new TaskServiceError(message, error.code, error);
  }
}

// Export singleton instance
export const taskService = new TaskService();
export default taskService;