/**
 * TaskFlow SDK Main Class
 * Centralized SDK for TaskFlow client applications
 */

import { FirebaseApp, initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getMessaging, Messaging } from 'firebase/messaging';
import EventEmitter from 'eventemitter3';

import { AuthService } from './services/authService';
import { TaskService } from './services/taskService';
import { TagService } from './services/tagService';
import { SyncManager } from './services/syncManager';
import { TaskFlowConfig, DEFAULT_CONFIG } from './index';

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
  'auth:login': { userId: string; email: string };
  'auth:logout': void;
  'sync:start': void;
  'sync:complete': { synced: number; conflicts: number };
  'sync:error': { error: string };
  'offline:detected': void;
  'online:detected': void;
  'task:created': { taskId: string };
  'task:updated': { taskId: string };
  'task:completed': { taskId: string };
  'task:deleted': { taskId: string };
  'notification:received': { title: string; body: string };
}

/**
 * Main TaskFlow SDK class
 */
export class TaskFlowSDK extends EventEmitter<SDKEvents> {
  private config: Required<TaskFlowConfig>;
  private firebaseApp: FirebaseApp;
  private auth: Auth;
  private firestore: Firestore;
  private messaging?: Messaging;
  
  // Service instances
  public readonly authService: AuthService;
  public readonly taskService: TaskService;
  public readonly tagService: TagService;
  public readonly syncManager: SyncManager;
  
  private initialized = false;
  private isOnline = navigator.onLine;

  constructor(config: SDKConfig) {
    super();
    
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize Firebase
    this.firebaseApp = initializeApp(config.firebase);
    this.auth = getAuth(this.firebaseApp);
    this.firestore = getFirestore(this.firebaseApp);
    
    // Initialize messaging for web push notifications (optional)
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        this.messaging = getMessaging(this.firebaseApp);
      }
    } catch (error) {
      this.log('warn', 'Firebase messaging not available:', error);
    }
    
    // Initialize services
    this.authService = new AuthService(this.auth, this.firestore, this.config);
    this.taskService = new TaskService(this.firestore, this.config);
    this.tagService = new TagService(this.firestore, this.config);
    this.syncManager = new SyncManager(this.firestore, this.config);
    
    // Set up event forwarding
    this.setupEventForwarding();
    
    // Set up online/offline detection
    this.setupNetworkDetection();
    
    this.log('info', 'TaskFlow SDK initialized');
  }

  /**
   * Initialize the SDK and start background processes
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.log('warn', 'SDK already initialized');
      return;
    }

    try {
      // Initialize sync manager
      if (this.config.enableOfflineSync) {
        await this.syncManager.initialize();
      }
      
      // Set up auth state listener
      this.auth.onAuthStateChanged((user) => {
        if (user) {
          this.emit('auth:login', { userId: user.uid, email: user.email! });
          
          // Start sync when user logs in
          if (this.config.enableOfflineSync) {
            this.syncManager.startSync();
          }
        } else {
          this.emit('auth:logout');
          
          // Stop sync when user logs out
          if (this.config.enableOfflineSync) {
            this.syncManager.stopSync();
          }
        }
      });
      
      this.initialized = true;
      this.log('info', 'SDK initialization complete');
      
    } catch (error) {
      this.log('error', 'SDK initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<TaskFlowConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TaskFlowConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update service configurations
    this.authService.updateConfig(this.config);
    this.taskService.updateConfig(this.config);
    this.tagService.updateConfig(this.config);
    this.syncManager.updateConfig(this.config);
    
    this.log('info', 'SDK configuration updated');
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.auth.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  /**
   * Check if SDK is online
   */
  isOnlineMode(): boolean {
    return this.isOnline;
  }

  /**
   * Force sync with server
   */
  async forcSync(): Promise<void> {
    if (!this.config.enableOfflineSync) {
      throw new Error('Offline sync is disabled');
    }
    
    if (!this.isAuthenticated()) {
      throw new Error('User must be authenticated to sync');
    }
    
    await this.syncManager.forceSync();
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return this.syncManager.getStatus();
  }

  /**
   * Clear all local data (logout cleanup)
   */
  async clearLocalData(): Promise<void> {
    if (this.config.enableOfflineSync) {
      await this.syncManager.clearLocalData();
    }
    
    this.log('info', 'Local data cleared');
  }

  /**
   * Enable debug mode
   */
  enableDebugMode(): void {
    this.config.logLevel = 'debug';
    this.log('info', 'Debug mode enabled');
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.config.logLevel = 'warn';
    this.log('info', 'Debug mode disabled');
  }

  /**
   * Get SDK version
   */
  getVersion(): string {
    return '1.0.0'; // This would typically come from package.json
  }

  /**
   * Get SDK health status
   */
  getHealth() {
    return {
      initialized: this.initialized,
      authenticated: this.isAuthenticated(),
      online: this.isOnline,
      syncEnabled: this.config.enableOfflineSync,
      syncStatus: this.config.enableOfflineSync ? this.syncManager.getStatus() : null,
      version: this.getVersion(),
    };
  }

  /**
   * Destroy SDK instance and clean up
   */
  async destroy(): Promise<void> {
    this.log('info', 'Destroying SDK instance...');
    
    try {
      // Stop sync manager
      if (this.config.enableOfflineSync) {
        this.syncManager.stopSync();
      }
      
      // Remove event listeners
      this.removeAllListeners();
      
      // Remove network listeners
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      
      this.initialized = false;
      
      this.log('info', 'SDK instance destroyed');
      
    } catch (error) {
      this.log('error', 'Error destroying SDK:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private setupEventForwarding(): void {
    // Forward auth service events
    this.authService.on('login', (data) => this.emit('auth:login', data));
    this.authService.on('logout', () => this.emit('auth:logout'));
    
    // Forward task service events
    this.taskService.on('taskCreated', (data) => this.emit('task:created', data));
    this.taskService.on('taskUpdated', (data) => this.emit('task:updated', data));
    this.taskService.on('taskCompleted', (data) => this.emit('task:completed', data));
    this.taskService.on('taskDeleted', (data) => this.emit('task:deleted', data));
    
    // Forward sync manager events
    if (this.config.enableOfflineSync) {
      this.syncManager.on('syncStart', () => this.emit('sync:start'));
      this.syncManager.on('syncComplete', (data) => this.emit('sync:complete', data));
      this.syncManager.on('syncError', (data) => this.emit('sync:error', data));
    }
  }

  private setupNetworkDetection(): void {
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
    
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = (): void => {
    this.isOnline = true;
    this.emit('online:detected');
    this.log('info', 'Network connection restored');
    
    // Resume sync when back online
    if (this.config.enableOfflineSync && this.isAuthenticated()) {
      this.syncManager.resumeSync();
    }
  };

  private handleOffline = (): void => {
    this.isOnline = false;
    this.emit('offline:detected');
    this.log('info', 'Network connection lost');
    
    // Pause sync when offline
    if (this.config.enableOfflineSync) {
      this.syncManager.pauseSync();
    }
  };

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = logLevels[this.config.logLevel];
    const messageLevel = logLevels[level];
    
    if (messageLevel >= currentLevel) {
      const prefix = `[TaskFlow SDK ${level.toUpperCase()}]`;
      console[level](prefix, message, ...args);
    }
  }
}

/**
 * Create a new TaskFlow SDK instance
 */
export function createTaskFlowSDK(config: SDKConfig): TaskFlowSDK {
  return new TaskFlowSDK(config);
}