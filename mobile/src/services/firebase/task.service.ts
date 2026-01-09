import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    onSnapshot,
    writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { Task, TaskFormData, TaskMode, TaskLabel } from '../../types';

const TASKS_COLLECTION = 'tasks';

// Get user's tasks collection reference
function getUserTasksRef(userId: string) {
    return collection(db, 'users', userId, TASKS_COLLECTION);
}

// Format date to YYYY-MM-DD
function formatDate(date: Date | string): string {
    if (typeof date === 'string') {
        // If already a string, ensure it's in YYYY-MM-DD format
        if (date.includes('T')) {
            return date.split('T')[0];
        }
        return date;
    }
    return date.toISOString().split('T')[0];
}

// Get tasks for a user
export async function getTasks(
    userId: string,
    options?: {
        mode?: TaskMode;
        date?: string;
        projectId?: string;
        includeCompleted?: boolean;
    }
): Promise<Task[]> {
    const tasksRef = getUserTasksRef(userId);
    const q = query(tasksRef, where('isDeleted', '!=', true));

    const snapshot = await getDocs(q);
    let tasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Task[];

    // Client-side filtering for more complex queries
    if (options?.mode) {
        tasks = tasks.filter((t) => t.mode === options.mode);
    }
    if (options?.date) {
        // Match by dueDate field (new) or startDate (legacy)
        tasks = tasks.filter((t) => {
            const taskDate = (t as any).dueDate || (t as any).startDate;
            return taskDate === options.date;
        });
    }
    if (options?.projectId) {
        tasks = tasks.filter((t) => t.projectId === options.projectId);
    }
    if (!options?.includeCompleted) {
        tasks = tasks.filter((t) => !t.completed);
    }

    // Sort by position then by date
    return tasks.sort((a, b) => (a.position || 0) - (b.position || 0));
}

// Get tasks for today
export async function getTodayTasks(userId: string): Promise<Task[]> {
    const today = formatDate(new Date());
    return getTasks(userId, { date: today, includeCompleted: true });
}

// Create a new task
export async function createTask(userId: string, data: TaskFormData): Promise<Task> {
    const tasksRef = getUserTasksRef(userId);
    const now = new Date().toISOString();
    const today = formatDate(new Date());

    // Ensure dueDate is properly formatted
    const dueDate = data.dueDate ? formatDate(data.dueDate) : today;

    const taskData = {
        title: data.title,
        description: data.description || '',
        label: data.label || 'none',
        mode: data.mode || 'home',
        tags: data.tags || [],
        dueDate: dueDate,
        startTime: data.startTime || null,
        isRepeating: data.isRepeating || false,
        repeatFrequency: data.repeatFrequency || null,
        repeatEndDate: data.repeatEndDate || null,
        subtasks: data.subtasks || [],
        projectId: data.projectId || null,
        userId,
        status: 'todo' as const,
        completed: false,
        position: Date.now(),
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
    };

    const docRef = await addDoc(tasksRef, taskData);
    return { id: docRef.id, ...taskData } as Task;
}

// Update a task
export async function updateTask(
    userId: string,
    taskId: string,
    updates: Partial<Task>
): Promise<void> {
    const taskRef = doc(db, 'users', userId, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
    });
}

// Toggle task completion
export async function toggleTaskComplete(userId: string, taskId: string, completed: boolean): Promise<void> {
    await updateTask(userId, taskId, {
        completed,
        status: completed ? 'completed' : 'todo',
    });
}

// Delete task (soft delete)
export async function deleteTask(userId: string, taskId: string): Promise<void> {
    await updateTask(userId, taskId, { isDeleted: true });
}

// Bulk toggle complete
export async function bulkToggleComplete(
    userId: string,
    taskIds: string[],
    completed: boolean
): Promise<void> {
    const batch = writeBatch(db);
    const updates = {
        completed,
        status: completed ? 'completed' : 'todo',
        updatedAt: new Date().toISOString(),
    };

    taskIds.forEach((taskId) => {
        const taskRef = doc(db, 'users', userId, TASKS_COLLECTION, taskId);
        batch.update(taskRef, updates);
    });

    await batch.commit();
}

// Update task positions (for drag and drop)
export async function updateTaskPositions(
    userId: string,
    taskPositions: { id: string; position: number }[]
): Promise<void> {
    const batch = writeBatch(db);

    taskPositions.forEach(({ id, position }) => {
        const taskRef = doc(db, 'users', userId, TASKS_COLLECTION, id);
        batch.update(taskRef, { position, updatedAt: new Date().toISOString() });
    });

    await batch.commit();
}

// Subscribe to tasks (real-time updates)
export function subscribeToTasks(
    userId: string,
    callback: (tasks: Task[]) => void
): () => void {
    const tasksRef = getUserTasksRef(userId);
    const q = query(tasksRef, where('isDeleted', '!=', true));

    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Task[];
        callback(tasks.sort((a, b) => (a.position || 0) - (b.position || 0)));
    });
}

// Subscribe to today's tasks specifically
export function subscribeToTodayTasks(
    userId: string,
    callback: (tasks: Task[]) => void
): () => void {
    const today = formatDate(new Date());

    return subscribeToTasks(userId, (allTasks) => {
        const todayTasks = allTasks.filter((t) => {
            const taskDate = (t as any).dueDate || (t as any).startDate;
            return taskDate === today;
        });
        callback(todayTasks);
    });
}
