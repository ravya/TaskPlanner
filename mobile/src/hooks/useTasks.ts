import { useState, useEffect, useCallback } from 'react';
import { Task, TaskMode } from '../types';
import { getTasks, getTodayTasks, subscribeToTasks } from '../services/firebase';

interface UseTasksOptions {
    mode?: TaskMode;
    date?: string;
    projectId?: string;
    includeCompleted?: boolean;
    realtime?: boolean;
}

export function useTasks(userId: string | undefined, options?: UseTasksOptions) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTasks = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);
            const data = await getTasks(userId, options);
            setTasks(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, [userId, options?.mode, options?.date, options?.projectId, options?.includeCompleted]);

    useEffect(() => {
        if (!userId) {
            setTasks([]);
            setLoading(false);
            return;
        }

        if (options?.realtime) {
            setLoading(true);
            const unsubscribe = subscribeToTasks(userId, (data) => {
                let filtered = data;
                if (options?.mode) {
                    filtered = filtered.filter((t) => t.mode === options.mode);
                }
                if (options?.date) {
                    filtered = filtered.filter((t) => t.startDate === options.date);
                }
                if (options?.projectId) {
                    filtered = filtered.filter((t) => t.projectId === options.projectId);
                }
                if (!options?.includeCompleted) {
                    filtered = filtered.filter((t) => !t.completed);
                }
                setTasks(filtered);
                setLoading(false);
            });
            return unsubscribe;
        } else {
            loadTasks();
        }
    }, [userId, loadTasks, options?.realtime]);

    return { tasks, loading, error, refresh: loadTasks, setTasks };
}

export function useTodayTasks(userId: string | undefined) {
    const today = new Date().toISOString().split('T')[0];
    return useTasks(userId, { date: today, includeCompleted: true, realtime: true });
}
