import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    return authService.login(email, password);
  };

  const register = async (email: string, password: string, displayName: string) => {
    return authService.register(email, password, displayName);
  };

  const logout = async () => {
    return authService.logout();
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
};
