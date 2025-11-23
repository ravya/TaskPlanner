import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { authService } from '../services/firebase/auth.service';
import { mockUser } from '../test/mockData';

// Mock the auth service
vi.mock('../services/firebase/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    sendPasswordReset: vi.fn(),
    sendEmailVerification: vi.fn(),
    updateUserProfile: vi.fn(),
    refreshToken: vi.fn(),
    onAuthStateChanged: vi.fn(() => () => { }),
  },
}));

// Mock the auth store
vi.mock('../store/slices/authSlice', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    setLoading: vi.fn(),
    setUser: vi.fn(),
  })),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Login', () => {
    it('should login successfully', async () => {
      const loginData = { email: 'test@example.com', password: 'password123' };
      vi.mocked(authService.login).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await result.current.login(loginData);

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith(loginData);
      });
    });

    it('should handle login error', async () => {
      const loginData = { email: 'test@example.com', password: 'wrong' };
      const errorMessage = 'Invalid credentials';
      vi.mocked(authService.login).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth());

      await expect(result.current.login(loginData)).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should set loading state during login', async () => {
      const loginData = { email: 'test@example.com', password: 'password123' };
      vi.mocked(authService.login).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockUser as any), 100)) as Promise<any>
      );

      const { result } = renderHook(() => useAuth());

      const loginPromise = result.current.login(loginData);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await loginPromise;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Register', () => {
    it('should register successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'New User',
        firstName: 'New',
        lastName: 'User',
      };
      vi.mocked(authService.register).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await result.current.register(registerData);

      expect(authService.register).toHaveBeenCalledWith(registerData);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle registration error', async () => {
      const error = new Error('Registration failed');
      vi.mocked(authService.register).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'New User',
        firstName: 'New',
        lastName: 'User',
      };

      await expect(result.current.register(registerData)).rejects.toThrow('Registration failed');
      expect(result.current.error).toBe('Registration failed');
    });
  });

  describe('Google Login', () => {
    it('should login with Google successfully', async () => {
      vi.mocked(authService.loginWithGoogle).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await result.current.loginWithGoogle();

      expect(authService.loginWithGoogle).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle Google login error', async () => {
      const error = new Error('Google login failed');
      vi.mocked(authService.loginWithGoogle).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await expect(result.current.loginWithGoogle()).rejects.toThrow('Google login failed');
      expect(result.current.error).toBe('Google login failed');
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      vi.mocked(authService.logout).mockResolvedValue();

      const { result } = renderHook(() => useAuth());

      await result.current.logout();

      expect(authService.logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
      expect(result.current.user).toBeNull();
    });

    it('should force logout on error', async () => {
      vi.mocked(authService.logout).mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuth());

      await result.current.logout();

      expect(result.current.user).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      const email = 'test@example.com';
      vi.mocked(authService.sendPasswordReset).mockResolvedValue();

      const { result } = renderHook(() => useAuth());

      await result.current.sendPasswordReset(email);

      expect(authService.sendPasswordReset).toHaveBeenCalledWith(email);
    });

    it('should handle password reset error', async () => {
      vi.mocked(authService.sendPasswordReset).mockRejectedValue(
        new Error('Failed to send email')
      );

      const { result } = renderHook(() => useAuth());

      await expect(result.current.sendPasswordReset('test@example.com')).rejects.toThrow();
    });
  });

  describe('Update Profile', () => {
    it('should update user profile', async () => {
      const updates = { displayName: 'Updated Name' };
      vi.mocked(authService.updateUserProfile).mockResolvedValue({
        ...mockUser,
        ...updates,
      });

      const { result } = renderHook(() => useAuth());

      await result.current.updateProfile(updates);

      await waitFor(() => {
        expect(authService.updateUserProfile).toHaveBeenCalledWith(updates);
      });
    });

    it('should throw error when no user is logged in', async () => {
      const { result } = renderHook(() => useAuth());

      await expect(result.current.updateProfile({ displayName: 'Test' })).rejects.toThrow(
        'No user logged in'
      );
    });
  });

  describe('Error Handling', () => {
    it('should clear error', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Login failed'));

      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      result.current.clearError();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Check Auth State', () => {
    it('should check auth state on mount', async () => {
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      result.current.checkAuthState();

      await waitFor(() => {
        expect(authService.getCurrentUser).toHaveBeenCalled();
      });
    });

    it('should handle no current user', async () => {
      vi.mocked(authService.getCurrentUser).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth());

      result.current.checkAuthState();

      await waitFor(() => {
        expect(authService.getCurrentUser).toHaveBeenCalled();
      });
    });
  });

  describe('Email Verification', () => {
    it('should send email verification', async () => {
      vi.mocked(authService.sendEmailVerification).mockResolvedValue();

      const { result } = renderHook(() => useAuth());

      await result.current.sendEmailVerification();

      expect(authService.sendEmailVerification).toHaveBeenCalled();
    });

    it('should throw error when no user is logged in', async () => {
      const { result } = renderHook(() => useAuth());

      await expect(result.current.sendEmailVerification()).rejects.toThrow(
        'No user logged in'
      );
    });
  });
});
