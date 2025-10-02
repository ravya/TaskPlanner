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
  arrayUnion,
  arrayRemove,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentReference,
  Query,
  Timestamp,
  FirestoreError,
  CollectionReference,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';

// Custom error type
export class FirestoreServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: FirestoreError
  ) {
    super(message);
    this.name = 'FirestoreServiceError';
  }
}

// Base document interface
export interface BaseDocument {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
}

// Task document interface
export interface TaskDocument extends BaseDocument {
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  reminderTime?: Date;
  tags: string[];
  userId: string;
  isDeleted: boolean;
  isOverdue?: boolean;
  completedAt?: Date;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
}

// Tag document interface
export interface TagDocument extends BaseDocument {
  name: string;
  color: string;
  userId: string;
  taskCount?: number;
  isDeleted: boolean;
}

// User preferences interface
export interface UserPreferencesDocument extends BaseDocument {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    defaultReminderTime: number; // minutes before due date
  };
  timezone: string;
  dateFormat: string;
  taskDefaults: {
    priority: 'low' | 'medium' | 'high' | 'urgent';
    reminderEnabled: boolean;
  };
}

// Query filters interface
export interface QueryFilters {
  limit?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  where?: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains' | 'array-contains-any';
    value: any;
  }>;
  startAfterDoc?: QueryDocumentSnapshot;
}

// Pagination result interface
export interface PaginationResult<T> {
  data: T[];
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot | null;
  total?: number;
}

class FirestoreService {
  /**
   * Get user's tasks collection reference
   */
  private getUserTasksRef(userId: string): CollectionReference {
    return collection(db, 'users', userId, 'tasks');
  }

  /**
   * Get user's tags collection reference
   */
  private getUserTagsRef(userId: string): CollectionReference {
    return collection(db, 'users', userId, 'tags');
  }

  /**
   * Get user preferences document reference
   */
  private getUserPreferencesRef(userId: string): DocumentReference {
    return doc(db, 'users', userId);
  }

  /**
   * Create a new task
   */
  async createTask(userId: string, taskData: Omit<TaskDocument, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'version'>): Promise<TaskDocument> {
    try {
      const tasksRef = this.getUserTasksRef(userId);
      
      const newTask: Omit<TaskDocument, 'id'> = {
        ...taskData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        isDeleted: false,
        isOverdue: taskData.dueDate ? taskData.dueDate < new Date() : false,
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
  async updateTask(userId: string, taskId: string, updates: Partial<TaskDocument>): Promise<TaskDocument> {
    try {
      const taskRef = doc(this.getUserTasksRef(userId), taskId);
      
      // Get current task to increment version
      const currentTask = await getDoc(taskRef);
      if (!currentTask.exists()) {
        throw new FirestoreServiceError('Task not found');
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        version: increment(1),
      };

      // Check if task is being completed
      if (updates.completed === true && currentTask.data().completed === false) {
        updateData.completedAt = serverTimestamp();
      } else if (updates.completed === false) {
        updateData.completedAt = null;
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
  async getTask(userId: string, taskId: string): Promise<TaskDocument> {
    try {
      const taskRef = doc(this.getUserTasksRef(userId), taskId);
      const taskSnapshot = await getDoc(taskRef);

      if (!taskSnapshot.exists()) {
        throw new FirestoreServiceError('Task not found');
      }

      return this.mapDocumentToTask(taskSnapshot);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to get task');
    }
  }

  /**
   * Get user's tasks with filtering and pagination
   */
  async getTasks(userId: string, filters: QueryFilters = {}): Promise<PaginationResult<TaskDocument>> {
    try {
      let q: Query = collection(db, 'users', userId, 'tasks');

      // Apply base filter (non-deleted tasks)
      q = query(q, where('isDeleted', '==', false));

      // Apply custom filters
      if (filters.where) {
        filters.where.forEach(filter => {
          q = query(q, where(filter.field, filter.operator as any, filter.value));
        });
      }

      // Apply ordering
      if (filters.orderBy) {
        q = query(q, orderBy(filters.orderBy.field, filters.orderBy.direction));
      } else {
        q = query(q, orderBy('updatedAt', 'desc'));
      }

      // Apply pagination
      if (filters.startAfterDoc) {
        q = query(q, startAfter(filters.startAfterDoc));
      }

      if (filters.limit) {
        q = query(q, limit(filters.limit + 1)); // +1 to check if there are more
      }

      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs.map(doc => this.mapDocumentToTask(doc));

      let hasMore = false;
      let resultTasks = tasks;
      let lastDoc: QueryDocumentSnapshot | null = null;

      if (filters.limit && tasks.length > filters.limit) {
        hasMore = true;
        resultTasks = tasks.slice(0, filters.limit);
        lastDoc = querySnapshot.docs[filters.limit - 1];
      } else if (tasks.length > 0) {
        lastDoc = querySnapshot.docs[tasks.length - 1];
      }

      return {
        data: resultTasks,
        hasMore,
        lastDoc,
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
        version: increment(1),
      });
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to delete task');
    }
  }

  /**
   * Create a new tag
   */
  async createTag(userId: string, tagData: Omit<TagDocument, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'version'>): Promise<TagDocument> {
    try {
      const tagsRef = this.getUserTagsRef(userId);
      
      const newTag: Omit<TagDocument, 'id'> = {
        ...tagData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        isDeleted: false,
        taskCount: 0,
      };

      const docRef = await addDoc(tagsRef, {
        ...newTag,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        ...newTag,
      };
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to create tag');
    }
  }

  /**
   * Get user's tags
   */
  async getTags(userId: string): Promise<TagDocument[]> {
    try {
      const tagsRef = this.getUserTagsRef(userId);
      const q = query(
        tagsRef,
        where('isDeleted', '==', false),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.mapDocumentToTag(doc));
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to get tags');
    }
  }

  /**
   * Update a tag
   */
  async updateTag(userId: string, tagId: string, updates: Partial<TagDocument>): Promise<TagDocument> {
    try {
      const tagRef = doc(this.getUserTagsRef(userId), tagId);
      
      await updateDoc(tagRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        version: increment(1),
      });

      return await this.getTag(userId, tagId);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to update tag');
    }
  }

  /**
   * Get a single tag by ID
   */
  async getTag(userId: string, tagId: string): Promise<TagDocument> {
    try {
      const tagRef = doc(this.getUserTagsRef(userId), tagId);
      const tagSnapshot = await getDoc(tagRef);

      if (!tagSnapshot.exists()) {
        throw new FirestoreServiceError('Tag not found');
      }

      return this.mapDocumentToTag(tagSnapshot);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to get tag');
    }
  }

  /**
   * Delete a tag
   */
  async deleteTag(userId: string, tagId: string): Promise<void> {
    try {
      const tagRef = doc(this.getUserTagsRef(userId), tagId);
      
      await updateDoc(tagRef, {
        isDeleted: true,
        updatedAt: serverTimestamp(),
        version: increment(1),
      });
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to delete tag');
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferencesDocument | null> {
    try {
      const userRef = this.getUserPreferencesRef(userId);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        return null;
      }

      return this.mapDocumentToUserPreferences(userSnapshot);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to get user preferences');
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferencesDocument>): Promise<UserPreferencesDocument> {
    try {
      const userRef = this.getUserPreferencesRef(userId);
      
      await updateDoc(userRef, {
        ...preferences,
        updatedAt: serverTimestamp(),
        version: increment(1),
      });

      const updatedDoc = await getDoc(userRef);
      return this.mapDocumentToUserPreferences(updatedDoc);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Failed to update user preferences');
    }
  }

  /**
   * Subscribe to real-time task updates
   */
  subscribeToTasks(
    userId: string,
    callback: (tasks: TaskDocument[]) => void,
    filters: QueryFilters = {}
  ): () => void {
    try {
      let q: Query = collection(db, 'users', userId, 'tasks');
      
      q = query(q, where('isDeleted', '==', false));
      
      if (filters.where) {
        filters.where.forEach(filter => {
          q = query(q, where(filter.field, filter.operator as any, filter.value));
        });
      }
      
      if (filters.orderBy) {
        q = query(q, orderBy(filters.orderBy.field, filters.orderBy.direction));
      } else {
        q = query(q, orderBy('updatedAt', 'desc'));
      }

      return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(doc => this.mapDocumentToTask(doc));
        callback(tasks);
      });
    } catch (error) {
      console.error('Failed to subscribe to tasks:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Batch update multiple documents
   */
  async batchUpdate(operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: string;
    docId?: string;
    data?: any;
  }>): Promise<void> {
    try {
      const batch = writeBatch(db);

      operations.forEach(operation => {
        switch (operation.type) {
          case 'create':
            if (operation.data) {
              const newDocRef = doc(collection(db, operation.collection));
              batch.set(newDocRef, {
                ...operation.data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
            break;
          case 'update':
            if (operation.docId && operation.data) {
              const docRef = doc(db, operation.collection, operation.docId);
              batch.update(docRef, {
                ...operation.data,
                updatedAt: serverTimestamp(),
                version: increment(1),
              });
            }
            break;
          case 'delete':
            if (operation.docId) {
              const docRef = doc(db, operation.collection, operation.docId);
              batch.update(docRef, {
                isDeleted: true,
                updatedAt: serverTimestamp(),
                version: increment(1),
              });
            }
            break;
        }
      });

      await batch.commit();
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError, 'Batch operation failed');
    }
  }

  /**
   * Map Firestore document to TaskDocument
   */
  private mapDocumentToTask(doc: DocumentSnapshot | QueryDocumentSnapshot): TaskDocument {
    const data = doc.data()!;
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      completed: data.completed,
      priority: data.priority,
      dueDate: data.dueDate?.toDate(),
      reminderTime: data.reminderTime?.toDate(),
      tags: data.tags || [],
      userId: data.userId,
      isDeleted: data.isDeleted,
      isOverdue: data.isOverdue,
      completedAt: data.completedAt?.toDate(),
      estimatedDuration: data.estimatedDuration,
      actualDuration: data.actualDuration,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      version: data.version || 1,
    };
  }

  /**
   * Map Firestore document to TagDocument
   */
  private mapDocumentToTag(doc: DocumentSnapshot | QueryDocumentSnapshot): TagDocument {
    const data = doc.data()!;
    return {
      id: doc.id,
      name: data.name,
      color: data.color,
      userId: data.userId,
      taskCount: data.taskCount || 0,
      isDeleted: data.isDeleted,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      version: data.version || 1,
    };
  }

  /**
   * Map Firestore document to UserPreferencesDocument
   */
  private mapDocumentToUserPreferences(doc: DocumentSnapshot): UserPreferencesDocument {
    const data = doc.data()!;
    return {
      id: doc.id,
      userId: data.userId,
      theme: data.theme || 'system',
      notifications: data.notifications || {
        email: true,
        push: true,
        defaultReminderTime: 15,
      },
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: data.dateFormat || 'MMM dd, yyyy',
      taskDefaults: data.taskDefaults || {
        priority: 'medium',
        reminderEnabled: true,
      },
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      version: data.version || 1,
    };
  }

  /**
   * Handle and transform Firestore errors
   */
  private handleFirestoreError(error: FirestoreError, defaultMessage: string): FirestoreServiceError {
    const errorMessages: Record<string, string> = {
      'permission-denied': 'You do not have permission to perform this action',
      'not-found': 'The requested document was not found',
      'already-exists': 'A document with this ID already exists',
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
    
    console.error('Firestore Error:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });

    return new FirestoreServiceError(message, error.code, error);
  }
}

// Export singleton instance
export const firestoreService = new FirestoreService();
export default firestoreService;