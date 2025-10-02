// Placeholder sync manager - not used in server-side functions
export class SyncManager {
  constructor() {}
  
  async initialize(): Promise<void> {
    console.log('Sync manager initialized (server-side placeholder)');
  }
  
  startSync(): void {}
  stopSync(): void {}
  pauseSync(): void {}
  resumeSync(): void {}
  
  async forceSync(): Promise<void> {}
  async clearLocalData(): Promise<void> {}
  
  getStatus() {
    return {
      isRunning: false,
      lastSyncTime: null,
      pendingChanges: 0,
      conflicts: 0,
    };
  }
}