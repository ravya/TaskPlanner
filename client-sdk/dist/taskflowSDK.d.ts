/**
 * TaskFlow SDK Main Class
 * Centralized SDK for TaskFlow client applications
 */
import EventEmitter from 'eventemitter3';
import { AuthService } from './services/authService';
import { TaskService } from './services/taskService';
import { TagService } from './services/tagService';
import { SyncManager } from './services/syncManager';
import { TaskFlowConfig } from './index';
export interface SDKConfig extends TaskFlowConfig {
    firebase: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
        measurementId?: string;
    };
}
export interface SDKEvents {
    'auth:login': {
        userId: string;
        email: string;
    };
    'auth:logout': void;
    'sync:start': void;
    'sync:complete': {
        synced: number;
        conflicts: number;
    };
    'sync:error': {
        error: string;
    };
    'offline:detected': void;
    'online:detected': void;
    'task:created': {
        taskId: string;
    };
    'task:updated': {
        taskId: string;
    };
    'task:completed': {
        taskId: string;
    };
    'task:deleted': {
        taskId: string;
    };
    'notification:received': {
        title: string;
        body: string;
    };
}
/**
 * Main TaskFlow SDK class
 */
export declare class TaskFlowSDK extends EventEmitter<SDKEvents> {
    private config;
    private firebaseApp;
    private auth;
    private firestore;
    private messaging?;
    readonly authService: AuthService;
    readonly taskService: TaskService;
    readonly tagService: TagService;
    readonly syncManager: SyncManager;
    private initialized;
    private isOnline;
    constructor(config: SDKConfig);
    /**
     * Initialize the SDK and start background processes
     */
    initialize(): Promise<void>;
    /**
     * Get current configuration
     */
    getConfig(): Required<TaskFlowConfig>;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<TaskFlowConfig>): void;
    /**
     * Get current user
     */
    getCurrentUser(): import("@firebase/auth").User | null;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Check if SDK is online
     */
    isOnlineMode(): boolean;
    /**
     * Force sync with server
     */
    forcSync(): Promise<void>;
    /**
     * Get sync status
     */
    getSyncStatus(): import("./services/syncManager").SyncStatus;
    /**
     * Clear all local data (logout cleanup)
     */
    clearLocalData(): Promise<void>;
    /**
     * Enable debug mode
     */
    enableDebugMode(): void;
    /**
     * Disable debug mode
     */
    disableDebugMode(): void;
    /**
     * Get SDK version
     */
    getVersion(): string;
    /**
     * Get SDK health status
     */
    getHealth(): {
        initialized: boolean;
        authenticated: boolean;
        online: boolean;
        syncEnabled: boolean;
        syncStatus: import("./services/syncManager").SyncStatus | null;
        version: string;
    };
    /**
     * Destroy SDK instance and clean up
     */
    destroy(): Promise<void>;
    /**
     * Private helper methods
     */
    private setupEventForwarding;
    private setupNetworkDetection;
    private handleOnline;
    private handleOffline;
    private log;
}
/**
 * Create a new TaskFlow SDK instance
 */
export declare function createTaskFlowSDK(config: SDKConfig): TaskFlowSDK;
//# sourceMappingURL=taskflowSDK.d.ts.map