export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockTask = {
  id: 'task-1',
  title: 'Test Task',
  description: 'This is a test task',
  status: 'todo' as const,
  priority: 'medium' as const,
  tags: ['work', 'important'],
  dueDate: new Date('2024-12-31'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  userId: 'test-user-123',
  estimatedTime: 60,
  actualTime: 0,
  isDeleted: false,
};

export const mockTasks = [
  {
    ...mockTask,
    id: 'task-1',
    title: 'High Priority Task',
    description: 'This is a high priority task',
    priority: 'high' as const,
    status: 'todo' as const,
  },
  {
    ...mockTask,
    id: 'task-2',
    title: 'In Progress Task',
    description: 'This task is currently in progress',
    priority: 'medium' as const,
    status: 'in_progress' as const,
  },
  {
    ...mockTask,
    id: 'task-3',
    title: 'Completed Task',
    description: 'This task has been completed',
    priority: 'low' as const,
    status: 'completed' as const,
    completedAt: new Date('2024-01-15'),
  },
];

export const mockTag = {
  id: 'tag-1',
  name: 'work',
  color: '#3b82f6',
  userId: 'test-user-123',
  usageCount: 5,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isDeleted: false,
};

export const mockTags = [
  { ...mockTag, id: 'tag-1', name: 'work', color: '#3b82f6' },
  { ...mockTag, id: 'tag-2', name: 'personal', color: '#10b981' },
  { ...mockTag, id: 'tag-3', name: 'urgent', color: '#ef4444' },
];

export const mockNotification = {
  id: 'notif-1',
  taskId: 'task-1',
  userId: 'test-user-123',
  type: 'deadline' as const,
  message: 'Task deadline approaching',
  isRead: false,
  createdAt: new Date('2024-01-01'),
};
