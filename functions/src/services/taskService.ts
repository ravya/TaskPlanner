import * as admin from 'firebase-admin';
import { Task, CreateTaskData, UpdateTaskData, TaskQueryOptions, ServiceResult, ERROR_CODES } from '../types';
export class TaskService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }
  async createTask(userId: string, taskData: CreateTaskData): Promise<ServiceResult<Task>> {
    try {
      const taskRef = this.db.collection('tasks').doc();
      const now = admin.firestore.Timestamp.now();
      
      const task: Task = {
        id: taskRef.id,
        userId,
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        tags: taskData.tags || [],
        dueDate: taskData.dueDate || null,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
        completedAt: null,
      };

      await taskRef.set({
        ...task,
        createdAt: now,
        updatedAt: now,
      });

      return { success: true, data: task };
    } catch (error) {
      console.error('Error creating task:', error);
      return { success: false, error: ERROR_CODES.INTERNAL_ERROR };
    }
  }

  async getUserTasks(userId: string, options?: TaskQueryOptions): Promise<ServiceResult<Task[]>> {
    try {
      let query = this.db.collection('tasks').where('userId', '==', userId);
      
      if (options?.status) {
        query = query.where('status', '==', options.status);
      }
      
      if (options?.priority) {
        query = query.where('priority', '==', options.priority);
      }

      const querySnapshot = await query.get();
      const tasks: Task[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          completedAt: data.completedAt ? data.completedAt.toDate() : null,
        } as Task);
      });

      return { success: true, data: tasks };
    } catch (error) {
      console.error('Error getting user tasks:', error);
      return { success: false, error: ERROR_CODES.INTERNAL_ERROR };
    }
  }

  async updateTask(userId: string, taskId: string, updateData: UpdateTaskData): Promise<ServiceResult<Task>> {
    try {
      const taskRef = this.db.collection('tasks').doc(taskId);
      const taskDoc = await taskRef.get();

      if (!taskDoc.exists) {
        return { success: false, error: ERROR_CODES.TASK_NOT_FOUND };
      }

      const taskData = taskDoc.data();
      if (taskData?.userId !== userId) {
        return { success: false, error: ERROR_CODES.UNAUTHORIZED };
      }

      const now = admin.firestore.Timestamp.now();
      const updates: any = {
        ...updateData,
        updatedAt: now,
      };

      if (updateData.status === 'completed' && taskData?.status !== 'completed') {
        updates.completedAt = now;
      }

      await taskRef.update(updates);

      const updatedDoc = await taskRef.get();
      const updatedData = updatedDoc.data();

      const updatedTask: Task = {
        ...updatedData,
        id: updatedDoc.id,
        createdAt: updatedData?.createdAt.toDate(),
        updatedAt: updatedData?.updatedAt.toDate(),
        completedAt: updatedData?.completedAt ? updatedData.completedAt.toDate() : null,
      } as Task;

      return { success: true, data: updatedTask };
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, error: ERROR_CODES.INTERNAL_ERROR };
    }
  }

  async deleteTask(userId: string, taskId: string): Promise<ServiceResult<void>> {
    try {
      const taskRef = this.db.collection('tasks').doc(taskId);
      const taskDoc = await taskRef.get();

      if (!taskDoc.exists) {
        return { success: false, error: ERROR_CODES.TASK_NOT_FOUND };
      }

      const taskData = taskDoc.data();
      if (taskData?.userId !== userId) {
        return { success: false, error: ERROR_CODES.UNAUTHORIZED };
      }

      await taskRef.delete();
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: ERROR_CODES.INTERNAL_ERROR };
    }
  }
}