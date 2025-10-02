"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncManager = void 0;
// Placeholder sync manager - not used in server-side functions
class SyncManager {
    constructor() { }
    async initialize() {
        console.log('Sync manager initialized (server-side placeholder)');
    }
    startSync() { }
    stopSync() { }
    pauseSync() { }
    resumeSync() { }
    async forceSync() { }
    async clearLocalData() { }
    getStatus() {
        return {
            isRunning: false,
            lastSyncTime: null,
            pendingChanges: 0,
            conflicts: 0,
        };
    }
}
exports.SyncManager = SyncManager;
//# sourceMappingURL=SyncManager.js.map