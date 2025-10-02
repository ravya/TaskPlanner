/**
 * TaskFlow SDK Placeholder - Not used in server-side functions
 * This is a client-side SDK that would be packaged separately
 */

// Placeholder export to prevent compilation errors
export class TaskFlowSDK {
  constructor() {
    console.log('TaskFlowSDK placeholder - not used in server functions');
  }
}

export function createTaskFlowSDK(): TaskFlowSDK {
  return new TaskFlowSDK();
}