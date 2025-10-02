/**
 * TaskFlow Offline Sync Manager
 * Handles offline data synchronization with server
 */
import { Firestore } from 'firebase/firestore';
import EventEmitter from 'eventemitter3';
import { TaskFlowConfig } from '../index';
export interface SyncStatus {
    isRunning: boolean;
    lastSyncTime: Date | null;
    pendingChanges: number;
    conflicts: number;
}
export declare class SyncManager extends EventEmitter {
    private firestore;
    private config;
    private syncInterval?;
    private status;
    constructor(firestore: Firestore, config: TaskFlowConfig);
    initialize(): Promise<void>;
    startSync(): void;
    stopSync(): void;
    pauseSync(): void;
    resumeSync(): void;
    forceSync(): Promise<void>;
    getStatus(): SyncStatus;
    clearLocalData(): Promise<void>;
    updateConfig(config: TaskFlowConfig): void;
    private performSync;
}
//# sourceMappingURL=syncManager.d.ts.map