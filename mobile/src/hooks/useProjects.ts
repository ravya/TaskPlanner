import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectMode } from '../types';
import { getProjects, subscribeToProjects } from '../services/firebase';

export function useProjects(userId: string | undefined, mode?: ProjectMode) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProjects = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);
            const data = await getProjects(userId, mode);
            setProjects(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    }, [userId, mode]);

    useEffect(() => {
        if (!userId) {
            setProjects([]);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToProjects(userId, setProjects, mode);
        setLoading(false);
        return unsubscribe;
    }, [userId, mode]);

    return { projects, loading, error, refresh: loadProjects };
}
