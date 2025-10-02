import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Theme type
export type Theme = 'light' | 'dark' | 'system';

// Notification interface
export interface UINotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: Date;
}

// Modal state interface
export interface ModalState {
  isOpen: boolean;
  type: string | null;
  props?: Record<string, any>;
}

// Loading state interface
export interface LoadingState {
  [key: string]: boolean;
}

// UI state interface
export interface UIState {
  // Theme
  theme: Theme;
  isDarkMode: boolean;
  
  // Layout
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Modals
  modal: ModalState;
  
  // Notifications/Toasts
  notifications: UINotification[];
  
  // Loading states
  loading: LoadingState;
  
  // Search
  searchQuery: string;
  searchFocused: boolean;
  
  // Filters and sorting
  activeFilters: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Pagination
  currentPage: number;
  itemsPerPage: number;
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
  
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  
  openModal: (type: string, props?: Record<string, any>) => void;
  closeModal: () => void;
  
  addNotification: (notification: Omit<UINotification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  setLoading: (key: string, loading: boolean) => void;
  clearLoading: () => void;
  
  setSearchQuery: (query: string) => void;
  setSearchFocused: (focused: boolean) => void;
  clearSearch: () => void;
  
  setFilters: (filters: Record<string, any>) => void;
  updateFilter: (key: string, value: any) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  
  setSorting: (sortBy: string, sortOrder?: 'asc' | 'desc') => void;
  
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  resetPagination: () => void;
}

// Generate notification ID
const generateNotificationId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Detect system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Calculate if dark mode should be active
const calculateDarkMode = (theme: Theme): boolean => {
  switch (theme) {
    case 'dark':
      return true;
    case 'light':
      return false;
    case 'system':
      return getSystemTheme() === 'dark';
    default:
      return false;
  }
};

// Create UI store with persistence
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      isDarkMode: calculateDarkMode('system'),
      
      sidebarOpen: false,
      sidebarCollapsed: false,
      
      modal: {
        isOpen: false,
        type: null,
        props: undefined,
      },
      
      notifications: [],
      loading: {},
      
      searchQuery: '',
      searchFocused: false,
      
      activeFilters: {},
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      
      currentPage: 1,
      itemsPerPage: 20,

      // Theme actions
      setTheme: (theme) => {
        const isDarkMode = calculateDarkMode(theme);
        set({ theme, isDarkMode });
        
        // Update document class for CSS
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', isDarkMode);
        }
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        let newTheme: Theme;
        
        switch (currentTheme) {
          case 'light':
            newTheme = 'dark';
            break;
          case 'dark':
            newTheme = 'system';
            break;
          case 'system':
            newTheme = 'light';
            break;
          default:
            newTheme = 'light';
        }
        
        get().setTheme(newTheme);
      },

      setDarkMode: (isDark) => {
        set({ isDarkMode: isDark });
        
        // Update document class for CSS
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', isDark);
        }
      },

      // Layout actions
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      toggleSidebarCollapsed: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      // Modal actions
      openModal: (type, props) => {
        set({
          modal: {
            isOpen: true,
            type,
            props,
          },
        });
      },

      closeModal: () => {
        set({
          modal: {
            isOpen: false,
            type: null,
            props: undefined,
          },
        });
      },

      // Notification actions
      addNotification: (notification) => {
        const newNotification: UINotification = {
          ...notification,
          id: generateNotificationId(),
          createdAt: new Date(),
        };
        
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-remove notification after duration (default 5 seconds)
        const duration = notification.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, duration);
        }
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      // Loading actions
      setLoading: (key, loading) => {
        set((state) => ({
          loading: { ...state.loading, [key]: loading },
        }));
      },

      clearLoading: () => {
        set({ loading: {} });
      },

      // Search actions
      setSearchQuery: (query) => {
        set({ searchQuery: query, currentPage: 1 }); // Reset pagination on search
      },

      setSearchFocused: (focused) => {
        set({ searchFocused: focused });
      },

      clearSearch: () => {
        set({ searchQuery: '', searchFocused: false });
      },

      // Filter actions
      setFilters: (filters) => {
        set({ activeFilters: filters, currentPage: 1 }); // Reset pagination on filter change
      },

      updateFilter: (key, value) => {
        set((state) => ({
          activeFilters: { ...state.activeFilters, [key]: value },
          currentPage: 1,
        }));
      },

      removeFilter: (key) => {
        set((state) => {
          const newFilters = { ...state.activeFilters };
          delete newFilters[key];
          return {
            activeFilters: newFilters,
            currentPage: 1,
          };
        });
      },

      clearFilters: () => {
        set({ activeFilters: {}, currentPage: 1 });
      },

      // Sorting actions
      setSorting: (sortBy, sortOrder = 'desc') => {
        set({ sortBy, sortOrder, currentPage: 1 }); // Reset pagination on sort change
      },

      // Pagination actions
      setCurrentPage: (page) => {
        set({ currentPage: page });
      },

      setItemsPerPage: (items) => {
        set({ itemsPerPage: items, currentPage: 1 });
      },

      resetPagination: () => {
        set({ currentPage: 1 });
      },
    }),
    {
      name: 'taskflow-ui',
      storage: createJSONStorage(() => localStorage),
      // Persist theme, sidebar, pagination, and filter preferences
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        itemsPerPage: state.itemsPerPage,
      }),
      // Handle rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply theme on rehydration
          state.setTheme(state.theme);
          console.log('🎨 UI state rehydrated');
        }
      },
    }
  )
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', (e) => {
    const store = useUIStore.getState();
    if (store.theme === 'system') {
      store.setDarkMode(e.matches);
    }
  });
}

// Selectors for better performance
export const uiSelectors = {
  theme: (state: UIState) => state.theme,
  isDarkMode: (state: UIState) => state.isDarkMode,
  sidebarOpen: (state: UIState) => state.sidebarOpen,
  sidebarCollapsed: (state: UIState) => state.sidebarCollapsed,
  modal: (state: UIState) => state.modal,
  notifications: (state: UIState) => state.notifications,
  isLoading: (key: string) => (state: UIState) => state.loading[key] || false,
  hasActiveFilters: (state: UIState) => Object.keys(state.activeFilters).length > 0,
  searchQuery: (state: UIState) => state.searchQuery,
  sorting: (state: UIState) => ({ sortBy: state.sortBy, sortOrder: state.sortOrder }),
  pagination: (state: UIState) => ({ 
    currentPage: state.currentPage, 
    itemsPerPage: state.itemsPerPage 
  }),
};