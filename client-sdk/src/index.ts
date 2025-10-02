/**
 * TaskFlow Client SDK
 * Main entry point for the TaskFlow client SDK
 */
// Export all types
export * from './types';
// Export client services
export { AuthService } from './services/authService';
export { TaskService } from './services/taskService';
export { TagService } from './services/tagService';
export { SyncManager } from './services/syncManager';
// Export SDK configuration
export { TaskFlowSDK, createTaskFlowSDK } from './taskflowSDK';
// Export types for SDK configuration
export interface TaskFlowConfig {
  apiBaseUrl?: string;
  enableOfflineSync?: boolean;
  enableAnalytics?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  syncInterval?: number;
  maxRetries?: number;
}
/**
 * Default SDK configuration
 */
export const DEFAULT_CONFIG: Required<TaskFlowConfig> = {
  apiBaseUrl: 'https://us-central1-taskflow-mvp.cloudfunctions.net/api',
  enableOfflineSync: true,
  enableAnalytics: false,
  logLevel: 'warn',
  syncInterval: 30000, // 30 seconds
  maxRetries: 3,
};