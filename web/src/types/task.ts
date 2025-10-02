// Core task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  tags: string[];
  assignedTo?: string;
  assignedBy?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  progress: number; // 0-100
  attachments: TaskAttachment[];
  subtasks: Subtask[];
  comments: TaskComment[];
  reminders: TaskReminder[];
  labels: TaskLabel[];
  metadata: TaskMetadata;
  isArchived: boolean;
  isDeleted: boolean;
  parentTaskId?: string;
  position: number; // for ordering
  boardId?: string;
  listId?: string;
}

// Task status enum
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

// Task priority enum
export enum TaskPriority {
  LOWEST = 'lowest',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HIGHEST = 'highest',
  URGENT = 'urgent',
}

// Subtask interface
export interface Subtask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  position: number;
}

// Task attachment
export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
}

// Task comment
export interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  mentions: string[];
  attachments: TaskAttachment[];
  reactions: TaskReaction[];
}

// Task reaction
export interface TaskReaction {
  emoji: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// Task reminder
export interface TaskReminder {
  id: string;
  type: ReminderType;
  scheduledFor: string;
  sent: boolean;
  sentAt?: string;
  message?: string;
}

// Reminder types
export enum ReminderType {
  DEADLINE = 'deadline',
  START_DATE = 'start_date',
  CUSTOM = 'custom',
}

// Task label
export interface TaskLabel {
  id: string;
  name: string;
  color: string;
  createdBy: string;
  createdAt: string;
}

// Task metadata
export interface TaskMetadata {
  source: 'web' | 'mobile' | 'api' | 'email' | 'integration';
  version: number;
  lastModifiedBy: string;
  timeTracking: TaskTimeTracking;
  automation: TaskAutomation;
  customFields: Record<string, any>;
}

// Task time tracking
export interface TaskTimeTracking {
  tracked: number; // minutes tracked
  sessions: TimeSession[];
  isActive: boolean;
  activeSessionStart?: string;
}

// Time tracking session
export interface TimeSession {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  description?: string;
  userId: string;
}

// Task automation
export interface TaskAutomation {
  rules: AutomationRule[];
  triggers: AutomationTrigger[];
}

// Automation rule
export interface AutomationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
}

// Automation trigger
export interface AutomationTrigger {
  id: string;
  event: string;
  condition?: string;
  action: string;
  enabled: boolean;
}

// Task form data
export interface TaskFormData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  tags: string[];
  assignedTo?: string;
  dueDate?: string;
  startDate?: string;
  estimatedDuration?: number;
  attachments?: File[];
  subtasks?: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt' | 'position'>[];
  labels?: string[];
  customFields?: Record<string, any>;
}

// Task update data
export interface TaskUpdateData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  tags?: string[];
  assignedTo?: string;
  dueDate?: string;
  startDate?: string;
  estimatedDuration?: number;
  progress?: number;
  labels?: string[];
  customFields?: Record<string, any>;
}

// Task filters
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: string[];
  tags?: string[];
  assignedTo?: string[];
  createdBy?: string[];
  dueDate?: {
    start?: string;
    end?: string;
  };
  createdAt?: {
    start?: string;
    end?: string;
  };
  completedAt?: {
    start?: string;
    end?: string;
  };
  search?: string;
  isArchived?: boolean;
  hasAttachments?: boolean;
  hasSubtasks?: boolean;
  isOverdue?: boolean;
  isDueSoon?: boolean; // due within next 7 days
}

// Task sort options
export interface TaskSortOptions {
  field: TaskSortField;
  direction: 'asc' | 'desc';
}

// Task sort fields
export enum TaskSortField {
  TITLE = 'title',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DUE_DATE = 'dueDate',
  PRIORITY = 'priority',
  STATUS = 'status',
  PROGRESS = 'progress',
  POSITION = 'position',
}

// Task view options
export interface TaskViewOptions {
  view: TaskView;
  groupBy?: TaskGroupBy;
  sortBy: TaskSortOptions;
  filters: TaskFilters;
  pageSize: number;
  showCompleted: boolean;
  showArchived: boolean;
}

// Task view types
export enum TaskView {
  LIST = 'list',
  GRID = 'grid',
  KANBAN = 'kanban',
  CALENDAR = 'calendar',
  TIMELINE = 'timeline',
  GANTT = 'gantt',
}

// Task group by options
export enum TaskGroupBy {
  NONE = 'none',
  STATUS = 'status',
  PRIORITY = 'priority',
  CATEGORY = 'category',
  ASSIGNEE = 'assignee',
  DUE_DATE = 'dueDate',
  CREATED_DATE = 'createdDate',
}

// Task statistics
export interface TaskStatistics {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
  dueSoon: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  byCategory: Record<string, number>;
  byAssignee: Record<string, number>;
  completionRate: number;
  averageCompletionTime: number; // in days
  productivity: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

// Task list response
export interface TaskListResponse {
  data: Task[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  statistics?: TaskStatistics;
}

// Task activity
export interface TaskActivity {
  id: string;
  taskId: string;
  type: TaskActivityType;
  userId: string;
  userName: string;
  userAvatar?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Task activity types
export enum TaskActivityType {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  COMMENTED = 'commented',
  ATTACHMENT_ADDED = 'attachment_added',
  ATTACHMENT_REMOVED = 'attachment_removed',
  SUBTASK_ADDED = 'subtask_added',
  SUBTASK_COMPLETED = 'subtask_completed',
  DUE_DATE_CHANGED = 'due_date_changed',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

// Task board (for Kanban view)
export interface TaskBoard {
  id: string;
  name: string;
  description?: string;
  lists: TaskList[];
  members: BoardMember[];
  settings: BoardSettings;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Task list (for Kanban columns)
export interface TaskList {
  id: string;
  name: string;
  color?: string;
  position: number;
  taskIds: string[];
  maxTasks?: number;
  boardId: string;
}

// Board member
export interface BoardMember {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  addedAt: string;
  addedBy: string;
}

// Board settings
export interface BoardSettings {
  isPublic: boolean;
  allowComments: boolean;
  allowAttachments: boolean;
  allowSubtasks: boolean;
  autoArchiveCompleted: boolean;
  autoArchiveDays: number;
  customFields: CustomField[];
}

// Custom field
export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'url';
  required: boolean;
  options?: string[]; // for select/multiselect fields
  defaultValue?: any;
  position: number;
}

// Task template
export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  template: Partial<TaskFormData>;
  isPublic: boolean;
  category?: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

// Bulk task operations
export interface BulkTaskOperation {
  taskIds: string[];
  operation: BulkOperationType;
  data?: any;
}

// Bulk operation types
export enum BulkOperationType {
  UPDATE_STATUS = 'update_status',
  UPDATE_PRIORITY = 'update_priority',
  UPDATE_ASSIGNEE = 'update_assignee',
  ADD_TAGS = 'add_tags',
  REMOVE_TAGS = 'remove_tags',
  ARCHIVE = 'archive',
  DELETE = 'delete',
  MOVE_TO_LIST = 'move_to_list',
  DUPLICATE = 'duplicate',
}

// Task export options
export interface TaskExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  filters?: TaskFilters;
  fields?: string[];
  includeComments?: boolean;
  includeAttachments?: boolean;
  includeSubtasks?: boolean;
}

// Task import data
export interface TaskImportData {
  file: File;
  mapping: Record<string, string>; // CSV column to task field mapping
  options: {
    skipFirstRow: boolean;
    createMissingTags: boolean;
    createMissingCategories: boolean;
    assignToCurrentUser: boolean;
  };
}

// Task analytics
export interface TaskAnalytics {
  completionTrends: {
    daily: { date: string; completed: number; total: number }[];
    weekly: { week: string; completed: number; total: number }[];
    monthly: { month: string; completed: number; total: number }[];
  };
  priorityDistribution: Record<TaskPriority, number>;
  statusDistribution: Record<TaskStatus, number>;
  categoryPerformance: {
    category: string;
    avgCompletionTime: number;
    completionRate: number;
    totalTasks: number;
  }[];
  userPerformance: {
    userId: string;
    userName: string;
    completedTasks: number;
    avgCompletionTime: number;
    efficiency: number;
  }[];
  timeTracking: {
    totalTracked: number;
    avgSessionDuration: number;
    mostProductiveHour: number;
    mostProductiveDay: string;
  };
}