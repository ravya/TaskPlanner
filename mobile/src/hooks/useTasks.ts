import { useState, useEffect, useCallback } from 'react';
import { Task, TaskMode } from '../types';
import { getTasks, subscribeToTasks, subscribeToTodayTasks } from '../services/firebase';

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
                    // Support both dueDate (new) and startDate (legacy)
                    filtered = filtered.filter((t) => {
                        const taskDate = (t as any).dueDate || (t as any).startDate;
                        return taskDate === options.date;
                    });
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
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        // Force refresh by re-subscribing
    }, []);

    useEffect(() => {
        if (!userId) {
            setTasks([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToTodayTasks(userId, (todayTasks) => {
            setTasks(todayTasks);
            setLoading(false);
        });

        return unsubscribe;
    }, [userId]);

    return { tasks, loading, error, refresh, setTasks };
}
