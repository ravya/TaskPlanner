import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { UserProfile } from '../types/auth';

export interface UseGoogleAuthOptions {
  onSuccess?: (user: UserProfile) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  prompt?: 'none' | 'consent' | 'select_account';
  scopes?: string[];
}

export interface UseGoogleAuthReturn {
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithGoogle: () => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  unlinkGoogleAccount: () => Promise<void>;
  clearError: () => void;
}

export const useGoogleAuth = (options: UseGoogleAuthOptions = {}): UseGoogleAuthReturn => {
  const {
    onSuccess,
    onError,
  } = options;

  const { loginWithGoogle, user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Sign in with Google (for existing users)
  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await loginWithGoogle();

      // Get the updated user after login
      if (onSuccess && user) {
        onSuccess(user);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Google sign in failed. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loginWithGoogle, onSuccess, onError, user]);

  // Sign up with Google (for new users) - same as sign in for Google
  const signUpWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await loginWithGoogle();

      if (onSuccess && user) {
        onSuccess(user);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Google sign up failed. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loginWithGoogle, onSuccess, onError, user]);

  // Link Google account to existing account
  const linkGoogleAccount = useCallback(async () => {
    if (!user) {
      const errorMessage = 'You must be signed in to link a Google account.';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This would require additional Firebase Auth linking functionality
      // For now, we'll simulate the process
      console.log('Linking Google account for user:', user.uid);

      // Update user profile to indicate Google is linked
      await updateProfile({
        provider: 'google',
      });

      if (onSuccess && user) {
        onSuccess(user);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to link Google account.';
      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, updateProfile, onSuccess, onError]);

  // Unlink Google account
  const unlinkGoogleAccount = useCallback(async () => {
    if (!user) {
      const errorMessage = 'You must be signed in to unlink a Google account.';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    if (user.provider !== 'google') {
      const errorMessage = 'Your account is not linked with Google.';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This would require additional Firebase Auth unlinking functionality
      // For now, we'll simulate the process
      console.log('Unlinking Google account for user:', user.uid);

      // Update user profile to remove Google provider
      await updateProfile({
        provider: 'email',
      });

      if (onSuccess && user) {
        onSuccess(user);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to unlink Google account.';
      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, updateProfile, onSuccess, onError]);

  return {
    isLoading,
    error,
    signInWithGoogle,
    signUpWithGoogle,
    linkGoogleAccount,
    unlinkGoogleAccount,
    clearError,
  };
};

// Higher-order component for Google Auth
export const withGoogleAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: UseGoogleAuthOptions
) => {
  return (props: P) => {
    const googleAuth = useGoogleAuth(options);
    return <Component {...props} googleAuth={googleAuth} />;
  };
};

export default useGoogleAuth;