export declare class SyncManager {
    constructor();
    initialize(): Promise<void>;
    startSync(): void;
    stopSync(): void;
    pauseSync(): void;
    resumeSync(): void;
    forceSync(): Promise<void>;
    clearLocalData(): Promise<void>;
    getStatus(): {
        isRunning: boolean;
        lastSyncTime: null;
        pendingChanges: number;
        conflicts: number;
    };
}
//# sourceMappingURL=SyncManager.d.ts.map