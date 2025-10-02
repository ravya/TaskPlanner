import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile } from '../../services/firebase/auth.service';

// Auth state interface
export interface AuthState {
  // State
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: UserProfile) => void;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  clearError: () => void;
}

// Create auth store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ 
          error,
          isLoading: false,
        });
      },

      login: (user) => {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
            error: null,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'taskflow-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist user data and authentication status
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Rehydrate state on app start
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('🔄 Auth state rehydrated');
        }
      },
    }
  )
);

// Selectors for better performance
export const authSelectors = {
  user: (state: AuthState) => state.user,
  isAuthenticated: (state: AuthState) => state.isAuthenticated,
  isLoading: (state: AuthState) => state.isLoading,
  error: (state: AuthState) => state.error,
  userId: (state: AuthState) => state.user?.uid || null,
  userEmail: (state: AuthState) => state.user?.email || null,
  userName: (state: AuthState) => state.user?.displayName || null,
  isEmailVerified: (state: AuthState) => state.user?.emailVerified || false,
};