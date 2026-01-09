/**
 * TaskFlow Database Collections Structure
 * Defines collection names, paths, and validation rules
 */

export const COLLECTIONS = {
  USERS: 'users',
  TASKS: 'tasks',
  TAGS: 'tags',
  NOTIFICATIONS: 'notifications',
  PROJECTS: 'projects',
} as const;

export const SUBCOLLECTIONS = {
  TASKS: 'tasks',
  TAGS: 'tags',
  NOTIFICATIONS: 'notifications',
  PROJECTS: 'projects',
} as const;

/**
 * Collection path builders for type safety
 */
export const getCollectionPath = {
  users: () => COLLECTIONS.USERS,
  userTasks: (userId: string) => `${COLLECTIONS.USERS}/${userId}/${SUBCOLLECTIONS.TASKS}`,
  userTags: (userId: string) => `${COLLECTIONS.USERS}/${userId}/${SUBCOLLECTIONS.TAGS}`,
  userNotifications: (userId: string) => `${COLLECTIONS.USERS}/${userId}/${SUBCOLLECTIONS.NOTIFICATIONS}`,
  userProjects: (userId: string) => `${COLLECTIONS.USERS}/${userId}/${SUBCOLLECTIONS.PROJECTS}`,
};

/**
 * Document ID generators
 */
export const generateId = {
  task: () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  tag: () => `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  notification: () => `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  project: () => `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
};

/**
 * Collection validation rules
 */
export const COLLECTION_LIMITS = {
  MAX_TASKS_PER_USER: 10000,
  MAX_TAGS_PER_USER: 100,
  MAX_NOTIFICATIONS_PER_USER: 1000,
  MAX_PROJECTS_PER_MODE: 10,
  MAX_TASK_TITLE_LENGTH: 200,
  MAX_TASK_DESCRIPTION_LENGTH: 2000,
  MAX_TAG_NAME_LENGTH: 30,
  MAX_PROJECT_NAME_LENGTH: 50,
  MAX_PROJECT_DESCRIPTION_LENGTH: 500,
} as const;