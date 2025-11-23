import { useState, useCallback, useMemo, useEffect } from 'react';

import {
  TaskStatus,
  TaskPriority,
  TaskSortField,
  TaskView,
  TaskGroupBy,
} from '../types/task';
import type {
  TaskFilters,
  TaskSortOptions,
} from '../types/task';

export interface UseTaskFiltersOptions {
  initialFilters?: TaskFilters;
  initialSort?: TaskSortOptions;
  initialView?: TaskView;
  initialGroupBy?: TaskGroupBy;
  persistKey?: string; // Key to persist filters in localStorage
}

export interface UseTaskFiltersReturn {
  // Current filters and options
  filters: TaskFilters;
  sortBy: TaskSortOptions;
  view: TaskView;
  groupBy: TaskGroupBy;

  // Filter actions
  setFilter: (key: keyof TaskFilters, value: any) => void;
  updateFilters: (newFilters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  resetFilters: () => void;

  // Sort actions
  setSortBy: (field: TaskSortField, direction?: 'asc' | 'desc') => void;
  toggleSortDirection: () => void;

  // View actions
  setView: (view: TaskView) => void;
  setGroupBy: (groupBy: TaskGroupBy) => void;

  // Quick filters
  setStatusFilter: (statuses: TaskStatus[]) => void;
  setPriorityFilter: (priorities: TaskPriority[]) => void;
  setAssigneeFilter: (assignees: string[]) => void;
  setTagFilter: (tags: string[]) => void;
  setSearchFilter: (search: string) => void;
  setDateRangeFilter: (field: 'dueDate' | 'createdAt' | 'completedAt', start?: string, end?: string) => void;

  // Computed values
  hasActiveFilters: boolean;
  filterCount: number;
  isFilterActive: (key: keyof TaskFilters) => boolean;
  getFilterValue: <K extends keyof TaskFilters>(key: K) => TaskFilters[K];

  // Presets
  applyPreset: (preset: FilterPreset) => void;
  savePreset: (name: string) => void;
  deletePreset: (name: string) => void;
  presets: FilterPreset[];
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: TaskFilters;
  sortBy: TaskSortOptions;
  view?: TaskView;
  groupBy?: TaskGroupBy;
  createdAt: string;
  isDefault?: boolean;
}

const DEFAULT_FILTERS: TaskFilters = {
  status: undefined,
  priority: undefined,
  category: undefined,
  tags: undefined,
  assignedTo: undefined,
  createdBy: undefined,
  dueDate: undefined,
  createdAt: undefined,
  completedAt: undefined,
  search: undefined,
  isArchived: false,
  hasAttachments: undefined,
  hasSubtasks: undefined,
  isOverdue: undefined,
  isDueSoon: undefined,
};

const DEFAULT_SORT: TaskSortOptions = {
  field: TaskSortField.UPDATED_AT,
  direction: 'desc',
};

const STORAGE_KEYS = {
  FILTERS: 'taskflow_task_filters',
  PRESETS: 'taskflow_filter_presets',
  VIEW_SETTINGS: 'taskflow_view_settings',
};

export const useTaskFilters = (options: UseTaskFiltersOptions = {}): UseTaskFiltersReturn => {
  const {
    initialFilters = DEFAULT_FILTERS,
    initialSort = DEFAULT_SORT,
    initialView = TaskView.LIST,
    initialGroupBy = TaskGroupBy.NONE,
    persistKey,
  } = options;

  // Load persisted data
  const loadPersistedData = useCallback(() => {
    if (!persistKey) return { filters: initialFilters, sort: initialSort };

    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.FILTERS}_${persistKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          filters: { ...DEFAULT_FILTERS, ...parsed.filters },
          sort: { ...DEFAULT_SORT, ...parsed.sort },
          view: parsed.view || initialView,
          groupBy: parsed.groupBy || initialGroupBy,
        };
      }
    } catch (error) {
      console.error('Failed to load persisted filters:', error);
    }

    return {
      filters: initialFilters,
      sort: initialSort,
      view: initialView,
      groupBy: initialGroupBy
    };
  }, [persistKey, initialFilters, initialSort, initialView, initialGroupBy]);

  const persistedData = useMemo(() => loadPersistedData(), [loadPersistedData]);

  // State
  const [filters, setFilters] = useState<TaskFilters>(persistedData.filters);
  const [sortBy, setSortByState] = useState<TaskSortOptions>(persistedData.sort);
  const [view, setViewState] = useState<TaskView>(persistedData.view);
  const [groupBy, setGroupByState] = useState<TaskGroupBy>(persistedData.groupBy);
  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRESETS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist data to localStorage
  const persistData = useCallback(() => {
    if (!persistKey) return;

    try {
      const dataToStore = {
        filters,
        sort: sortBy,
        view,
        groupBy,
        timestamp: Date.now(),
      };
      localStorage.setItem(`${STORAGE_KEYS.FILTERS}_${persistKey}`, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to persist filters:', error);
    }
  }, [persistKey, filters, sortBy, view, groupBy]);

  // Auto-persist when data changes
  useEffect(() => {
    persistData();
  }, [persistData]);

  // Filter actions
  const setFilter = useCallback((key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<TaskFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSortByState(initialSort);
    setViewState(initialView);
    setGroupByState(initialGroupBy);
  }, [initialFilters, initialSort, initialView, initialGroupBy]);

  // Sort actions
  const setSortBy = useCallback((field: TaskSortField, direction: 'asc' | 'desc' = 'desc') => {
    setSortByState({ field, direction });
  }, []);

  const toggleSortDirection = useCallback(() => {
    setSortByState(prev => ({
      ...prev,
      direction: prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // View actions
  const setView = useCallback((newView: TaskView) => {
    setViewState(newView);
  }, []);

  const setGroupBy = useCallback((newGroupBy: TaskGroupBy) => {
    setGroupByState(newGroupBy);
  }, []);

  // Quick filter actions
  const setStatusFilter = useCallback((statuses: TaskStatus[]) => {
    setFilter('status', statuses.length > 0 ? statuses : undefined);
  }, [setFilter]);

  const setPriorityFilter = useCallback((priorities: TaskPriority[]) => {
    setFilter('priority', priorities.length > 0 ? priorities : undefined);
  }, [setFilter]);

  const setAssigneeFilter = useCallback((assignees: string[]) => {
    setFilter('assignedTo', assignees.length > 0 ? assignees : undefined);
  }, [setFilter]);

  const setTagFilter = useCallback((tags: string[]) => {
    setFilter('tags', tags.length > 0 ? tags : undefined);
  }, [setFilter]);

  const setSearchFilter = useCallback((search: string) => {
    setFilter('search', search.trim() || undefined);
  }, [setFilter]);

  const setDateRangeFilter = useCallback((
    field: 'dueDate' | 'createdAt' | 'completedAt',
    start?: string,
    end?: string
  ) => {
    if (!start && !end) {
      setFilter(field, undefined);
    } else {
      setFilter(field, { start, end });
    }
  }, [setFilter]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'isArchived') return value === true; // Only consider archived=true as active
      return value !== undefined && value !== null && value !== '';
    });
  }, [filters]);

  const filterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'isArchived') return value === true;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== undefined);
      }
      return value !== undefined && value !== null && value !== '';
    }).length;
  }, [filters]);

  const isFilterActive = useCallback((key: keyof TaskFilters) => {
    const value = filters[key];
    if (key === 'isArchived') return value === true;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined);
    }
    return value !== undefined && value !== null && value !== '';
  }, [filters]);

  const getFilterValue = useCallback(<K extends keyof TaskFilters>(key: K): TaskFilters[K] => {
    return filters[key];
  }, [filters]);

  // Preset management
  const applyPreset = useCallback((preset: FilterPreset) => {
    setFilters(preset.filters);
    setSortByState(preset.sortBy);
    if (preset.view) setViewState(preset.view);
    if (preset.groupBy) setGroupByState(preset.groupBy);
  }, []);

  const savePreset = useCallback((name: string) => {
    const newPreset: FilterPreset = {
      id: `preset_${Date.now()}`,
      name,
      filters,
      sortBy,
      view,
      groupBy,
      createdAt: new Date().toISOString(),
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);

    try {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  }, [presets, filters, sortBy, view, groupBy]);

  const deletePreset = useCallback((presetId: string) => {
    const updatedPresets = presets.filter(p => p.id !== presetId);
    setPresets(updatedPresets);

    try {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  }, [presets]);

  return {
    // Current state
    filters,
    sortBy,
    view,
    groupBy,

    // Filter actions
    setFilter,
    updateFilters,
    clearFilters,
    resetFilters,

    // Sort actions
    setSortBy,
    toggleSortDirection,

    // View actions
    setView,
    setGroupBy,

    // Quick filters
    setStatusFilter,
    setPriorityFilter,
    setAssigneeFilter,
    setTagFilter,
    setSearchFilter,
    setDateRangeFilter,

    // Computed values
    hasActiveFilters,
    filterCount,
    isFilterActive,
    getFilterValue,

    // Presets
    applyPreset,
    savePreset,
    deletePreset,
    presets,
  };
};

// Predefined filter presets
export const DEFAULT_PRESETS: Omit<FilterPreset, 'id' | 'createdAt'>[] = [
  {
    name: 'My Open Tasks',
    filters: {
      ...DEFAULT_FILTERS,
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
      isArchived: false,
    },
    sortBy: { field: TaskSortField.DUE_DATE, direction: 'asc' },
    isDefault: true,
  },
  {
    name: 'Due Today',
    filters: {
      ...DEFAULT_FILTERS,
      dueDate: {
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
    },
    sortBy: { field: TaskSortField.PRIORITY, direction: 'desc' },
    isDefault: true,
  },
  {
    name: 'High Priority',
    filters: {
      ...DEFAULT_FILTERS,
      priority: [TaskPriority.HIGH, TaskPriority.HIGHEST, TaskPriority.URGENT],
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
    },
    sortBy: { field: TaskSortField.PRIORITY, direction: 'desc' },
    isDefault: true,
  },
  {
    name: 'Overdue Tasks',
    filters: {
      ...DEFAULT_FILTERS,
      isOverdue: true,
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
    },
    sortBy: { field: TaskSortField.DUE_DATE, direction: 'asc' },
    isDefault: true,
  },
  {
    name: 'Recently Completed',
    filters: {
      ...DEFAULT_FILTERS,
      status: [TaskStatus.COMPLETED],
      completedAt: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    },
    sortBy: { field: TaskSortField.UPDATED_AT, direction: 'desc' },
    isDefault: true,
  },
];

export default useTaskFilters;