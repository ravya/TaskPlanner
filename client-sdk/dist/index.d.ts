/**
 * TaskFlow Client SDK
 * Main entry point for the TaskFlow client SDK
 */
export * from './types';
export { AuthService } from './services/authService';
export { TaskService } from './services/taskService';
export { TagService } from './services/tagService';
export { SyncManager } from './services/syncManager';
export { TaskFlowSDK, createTaskFlowSDK } from './taskflowSDK';
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
export declare const DEFAULT_CONFIG: Required<TaskFlowConfig>;
//# sourceMappingURL=index.d.ts.map