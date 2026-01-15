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
    getDoc,
} from 'firebase/firestore';
import { db } from './config';
import { Task, TaskFormData, TaskMode, TaskLabel } from '../../types';
import { adjustProjectTaskCounts } from './project.service';

const TASKS_COLLECTION = 'tasks';

// Get user's tasks collection reference
function getUserTasksRef(userId: string) {
    return collection(db, 'users', userId, TASKS_COLLECTION);
}

// Format date to YYYY-MM-DD (Local)
function formatDate(date: Date | string): string {
    if (typeof date === 'string') {
        if (date.includes('T')) {
            return date.split('T')[0];
        }
        return date;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// === TIMEZONE UTILITIES ===

// Convert local date to UTC string for storage
function toUTCDateString(localDate: Date): string {
    return localDate.toISOString().split('T')[0];
}

// Get today's date in local timezone as YYYY-MM-DD
function getTodayLocal(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Convert UTC date string to local date string for comparison
function utcToLocalDateString(utcDateString: string): string {
    // Parse the UTC date and get local date components
    const date = new Date(utcDateString + 'T12:00:00Z'); // Use noon to avoid edge cases
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Check if a local date string (YYYY-MM-DD) matches today's local date
function isToday(dateString: string): boolean {
    if (dateString.includes('T')) {
        return dateString.split('T')[0] === getTodayLocal();
    }
    return dateString === getTodayLocal();
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
        labels: data.labels || [],
        mode: data.mode || 'home',
        tags: data.tags || [],
        dueDate: dueDate,
        deadlineDate: data.deadlineDate || null,
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

    // Update project count
    if (taskData.projectId) {
        await adjustProjectTaskCounts(userId, taskData.projectId, 1, 0);
    }

    return { id: docRef.id, ...taskData } as Task;
}

// Update a task
export async function updateTask(
    userId: string,
    taskId: string,
    updates: Partial<Task>
): Promise<void> {
    const taskRef = doc(db, 'users', userId, TASKS_COLLECTION, taskId);

    // Get old task data to check if project or completion status changed
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) return;
    const oldTask = taskSnap.data() as Task;

    await updateDoc(taskRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
    });

    // Handle project change or completion change in updateTask
    const projectChanged = updates.projectId !== undefined && updates.projectId !== oldTask.projectId;
    const completionChanged = updates.completed !== undefined && updates.completed !== oldTask.completed;

    if (projectChanged) {
        // Decrement old project
        if (oldTask.projectId) {
            await adjustProjectTaskCounts(userId, oldTask.projectId, -1, oldTask.completed ? -1 : 0);
        }
        // Increment new project
        if (updates.projectId) {
            const isNowCompleted = updates.completed !== undefined ? updates.completed : oldTask.completed;
            await adjustProjectTaskCounts(userId, updates.projectId, 1, isNowCompleted ? 1 : 0);
        }
    } else if (completionChanged && oldTask.projectId) {
        // Project didn't change, but completion did
        await adjustProjectTaskCounts(userId, oldTask.projectId, 0, updates.completed ? 1 : -1);
    }
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
    const taskRef = doc(db, 'users', userId, TASKS_COLLECTION, taskId);
    const taskSnap = await getDoc(taskRef);
    const taskData = taskSnap.exists() ? taskSnap.data() as Task : null;

    await updateTask(userId, taskId, { isDeleted: true });

    if (taskData?.projectId && !taskData.isDeleted) {
        await adjustProjectTaskCounts(
            userId,
            taskData.projectId,
            -1,
            taskData.completed ? -1 : 0
        );
    }
}

// Bulk toggle complete
export async function bulkToggleComplete(
    userId: string,
    taskIds: string[],
    completed: boolean
): Promise<void> {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    const updates = {
        completed,
        status: completed ? 'completed' : 'todo',
        updatedAt: now,
    };

    // We need to update project counts for each task
    for (const taskId of taskIds) {
        const taskRef = doc(db, 'users', userId, TASKS_COLLECTION, taskId);
        const taskSnap = await getDoc(taskRef);
        if (taskSnap.exists()) {
            const taskData = taskSnap.data() as Task;
            batch.update(taskRef, updates);

            // Only adjust if completion status is actually changing
            if (taskData.projectId && taskData.completed !== completed) {
                await adjustProjectTaskCounts(userId, taskData.projectId, 0, completed ? 1 : -1);
            }
        }
    }

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
    return subscribeToTasks(userId, (allTasks) => {
        const todayTasks = allTasks.filter((t) => {
            const taskDate = (t as any).dueDate || (t as any).startDate;
            // Verify if task matches today's local date
            return taskDate && isToday(taskDate) && !t.isDeleted;
        });
        callback(todayTasks);
    });
}
