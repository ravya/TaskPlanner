"use strict";
/**
 * TaskFlow SDK Main Class
 * Centralized SDK for TaskFlow client applications
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskFlowSDK = void 0;
exports.createTaskFlowSDK = createTaskFlowSDK;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const messaging_1 = require("firebase/messaging");
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const authService_1 = require("./services/authService");
const taskService_1 = require("./services/taskService");
const tagService_1 = require("./services/tagService");
const syncManager_1 = require("./services/syncManager");
const index_1 = require("./index");
/**
 * Main TaskFlow SDK class
 */
class TaskFlowSDK extends eventemitter3_1.default {
    constructor(config) {
        super();
        this.initialized = false;
        this.isOnline = navigator.onLine;
        this.handleOnline = () => {
            this.isOnline = true;
            this.emit('online:detected');
            this.log('info', 'Network connection restored');
            // Resume sync when back online
            if (this.config.enableOfflineSync && this.isAuthenticated()) {
                this.syncManager.resumeSync();
            }
        };
        this.handleOffline = () => {
            this.isOnline = false;
            this.emit('offline:detected');
            this.log('info', 'Network connection lost');
            // Pause sync when offline
            if (this.config.enableOfflineSync) {
                this.syncManager.pauseSync();
            }
        };
        this.config = { ...index_1.DEFAULT_CONFIG, ...config };
        // Initialize Firebase
        this.firebaseApp = (0, app_1.initializeApp)(config.firebase);
        this.auth = (0, auth_1.getAuth)(this.firebaseApp);
        this.firestore = (0, firestore_1.getFirestore)(this.firebaseApp);
        // Initialize messaging for web push notifications (optional)
        try {
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                this.messaging = (0, messaging_1.getMessaging)(this.firebaseApp);
            }
        }
        catch (error) {
            this.log('warn', 'Firebase messaging not available:', error);
        }
        // Initialize services
        this.authService = new authService_1.AuthService(this.auth, this.firestore, this.config);
        this.taskService = new taskService_1.TaskService(this.firestore, this.config);
        this.tagService = new tagService_1.TagService(this.firestore, this.config);
        this.syncManager = new syncManager_1.SyncManager(this.firestore, this.config);
        // Set up event forwarding
        this.setupEventForwarding();
        // Set up online/offline detection
        this.setupNetworkDetection();
        this.log('info', 'TaskFlow SDK initialized');
    }
    /**
     * Initialize the SDK and start background processes
     */
    async initialize() {
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
                    this.emit('auth:login', { userId: user.uid, email: user.email });
                    // Start sync when user logs in
                    if (this.config.enableOfflineSync) {
                        this.syncManager.startSync();
                    }
                }
                else {
                    this.emit('auth:logout');
                    // Stop sync when user logs out
                    if (this.config.enableOfflineSync) {
                        this.syncManager.stopSync();
                    }
                }
            });
            this.initialized = true;
            this.log('info', 'SDK initialization complete');
        }
        catch (error) {
            this.log('error', 'SDK initialization failed:', error);
            throw error;
        }
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
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
    isAuthenticated() {
        return this.auth.currentUser !== null;
    }
    /**
     * Check if SDK is online
     */
    isOnlineMode() {
        return this.isOnline;
    }
    /**
     * Force sync with server
     */
    async forcSync() {
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
    async clearLocalData() {
        if (this.config.enableOfflineSync) {
            await this.syncManager.clearLocalData();
        }
        this.log('info', 'Local data cleared');
    }
    /**
     * Enable debug mode
     */
    enableDebugMode() {
        this.config.logLevel = 'debug';
        this.log('info', 'Debug mode enabled');
    }
    /**
     * Disable debug mode
     */
    disableDebugMode() {
        this.config.logLevel = 'warn';
        this.log('info', 'Debug mode disabled');
    }
    /**
     * Get SDK version
     */
    getVersion() {
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
    async destroy() {
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
        }
        catch (error) {
            this.log('error', 'Error destroying SDK:', error);
            throw error;
        }
    }
    /**
     * Private helper methods
     */
    setupEventForwarding() {
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
    setupNetworkDetection() {
        this.handleOnline = this.handleOnline.bind(this);
        this.handleOffline = this.handleOffline.bind(this);
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
    }
    log(level, message, ...args) {
        const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = logLevels[this.config.logLevel];
        const messageLevel = logLevels[level];
        if (messageLevel >= currentLevel) {
            const prefix = `[TaskFlow SDK ${level.toUpperCase()}]`;
            console[level](prefix, message, ...args);
        }
    }
}
exports.TaskFlowSDK = TaskFlowSDK;
/**
 * Create a new TaskFlow SDK instance
 */
function createTaskFlowSDK(config) {
    return new TaskFlowSDK(config);
}
//# sourceMappingURL=taskflowSDK.js.map