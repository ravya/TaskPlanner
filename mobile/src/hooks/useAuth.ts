import { useState, useEffect } from 'react';
import { User } from '../types';
import { onAuthStateChange, getCurrentUser } from '../services/firebase';

export function useAuth() {
    const [user, setUser] = useState<User | null>(getCurrentUser());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { user, loading, error, setError };
}
