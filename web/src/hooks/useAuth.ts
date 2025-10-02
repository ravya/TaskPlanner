import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/slices/authSlice';
import { authService } from '../services/firebase/auth.service';
import type { LoginData, RegisterData, UserProfile } from '../types/auth';

export interface UseAuthReturn {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshToken: () => Promise<void>;
  checkAuthState: () => void;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    login: setLogin,
    logout: setLogout,
    setLoading,
    setUser,
  } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check authentication state on mount
  const checkAuthState = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setLogin(currentUser);
      } else {
        setLogout();
      }
    } catch (error) {
      console.error('Auth state check failed:', error);
      setLogout();
    } finally {
      setIsLoading(false);
    }
  }, [setLogin, setLogout]);

  // Login with email and password
  const login = useCallback(async (data: LoginData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userProfile = await authService.login(data);
      setLogin(userProfile);
    } catch (error: any) {
      const errorMessage = error?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [setLogin]);

  // Register new user
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userProfile = await authService.register(data);
      setLogin(userProfile);
    } catch (error: any) {
      const errorMessage = error?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [setLogin]);

  // Login with Google
  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userProfile = await authService.loginWithGoogle();
      setLogin(userProfile);
    } catch (error: any) {
      const errorMessage = error?.message || 'Google login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [setLogin]);

  // Logout
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.logout();
      setLogout();
      navigate('/auth/login');
    } catch (error: any) {
      console.error('Logout failed:', error);
      // Force logout even if service call fails
      setLogout();
      navigate('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [setLogout, navigate]);

  // Send password reset email
  const sendPasswordReset = useCallback(async (email: string) => {
    setError(null);
    
    try {
      await authService.sendPasswordReset(email);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to send password reset email.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Send email verification
  const sendEmailVerification = useCallback(async () => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    setError(null);
    
    try {
      await authService.sendEmailVerification();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to send verification email.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Update user profile
  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update profile.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, setUser]);

  // Refresh authentication token
  const refreshToken = useCallback(async () => {
    try {
      await authService.refreshToken();
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      setLogout();
      navigate('/auth/login');
    }
  }, [setLogout, navigate]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      if (user) {
        setLogin(user);
      } else {
        setLogout();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setLogin, setLogout, setLoading]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (isAuthenticated && user?.tokenExpiry) {
      const timeUntilRefresh = user.tokenExpiry - Date.now() - 5 * 60 * 1000; // 5 minutes before expiry
      
      if (timeUntilRefresh > 0) {
        const refreshTimeout = setTimeout(refreshToken, timeUntilRefresh);
        return () => clearTimeout(refreshTimeout);
      }
    }
  }, [isAuthenticated, user?.tokenExpiry, refreshToken]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    sendPasswordReset,
    sendEmailVerification,
    updateProfile,
    refreshToken,
    checkAuthState,
    clearError,
  };
};

export default useAuth;