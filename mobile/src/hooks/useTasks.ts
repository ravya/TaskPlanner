import { useState, useEffect, useCallback } from 'react';
import { Task, TaskMode } from '../types';
import { getTasks, subscribeToTasks, subscribeToTodayTasks } from '../services/firebase';

export type FilterType = 'today' | 'weekly' | 'upcoming' | 'recurring' | 'completed' | 'trash' | 'project';

interface UseTasksOptions {
    mode?: TaskMode;
    date?: string;
    projectId?: string;
    filterType?: FilterType;
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
    }, [userId, options?.mode, options?.date, options?.projectId, options?.filterType, options?.includeCompleted]);

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

                // First filter by mode
                if (options?.mode && options.mode !== 'all' as any) {
                    filtered = filtered.filter((t) => t.mode === options.mode);
                }

                // Apply specific filter types
                if (options?.filterType) {
                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                    // For weekly, get date 7 days from now
                    const nextWeekDate = new Date();
                    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
                    const nextWeekStr = `${nextWeekDate.getFullYear()}-${String(nextWeekDate.getMonth() + 1).padStart(2, '0')}-${String(nextWeekDate.getDate()).padStart(2, '0')}`;

                    switch (options.filterType) {
                        case 'today':
                            filtered = filtered.filter(t => {
                                const taskDate = (t as any).dueDate || (t as any).startDate;
                                return taskDate === todayStr;
                            });
                            break;
                        case 'weekly':
                            filtered = filtered.filter(t => {
                                const taskDate = (t as any).dueDate || (t as any).startDate;
                                return taskDate >= todayStr && taskDate <= nextWeekStr;
                            });
                            break;
                        case 'upcoming':
                            filtered = filtered.filter(t => {
                                const taskDate = (t as any).dueDate || (t as any).startDate;
                                return taskDate > todayStr && taskDate <= nextWeekStr;
                            });
                            break;
                        case 'recurring':
                            filtered = filtered.filter(t => t.isRepeating);
                            break;
                        case 'completed':
                            filtered = filtered.filter(t => t.completed);
                            break;
                        case 'trash':
                            filtered = filtered.filter(t => t.isDeleted === true);
                            break;
                        case 'project':
                            if (options.projectId) {
                                filtered = filtered.filter(t => t.projectId === options.projectId);
                            }
                            break;
                    }
                } else {
                    // Default behavior (if no filterType specified)
                    if (options?.date) {
                        filtered = filtered.filter((t) => {
                            const taskDate = (t as any).dueDate || (t as any).startDate;
                            return taskDate === options.date;
                        });
                    }
                    if (options?.projectId) {
                        filtered = filtered.filter((t) => t.projectId === options.projectId);
                    }
                }

                // Apply global filters EXCEPT for specific cases
                if (options?.filterType !== 'completed' && options?.filterType !== 'trash') {
                    if (!options?.includeCompleted) {
                        filtered = filtered.filter((t) => !t.completed);
                    }
                }

                if (options?.filterType !== 'trash') {
                    filtered = filtered.filter(t => !t.isDeleted);
                }

                setTasks(filtered);
                setLoading(false);
            });
            return unsubscribe;
        } else {
            loadTasks();
        }
    }, [userId, loadTasks, options?.realtime, options?.filterType, options?.projectId]);

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
