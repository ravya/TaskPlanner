import { Task, CreateTaskData, UpdateTaskData, TaskQueryOptions, ServiceResult } from '../types';
export declare class TaskService {
    private db;
    constructor();
    createTask(userId: string, taskData: CreateTaskData): Promise<ServiceResult<Task>>;
    getUserTasks(userId: string, options?: TaskQueryOptions): Promise<ServiceResult<Task[]>>;
    updateTask(userId: string, taskId: string, updateData: UpdateTaskData): Promise<ServiceResult<Task>>;
    deleteTask(userId: string, taskId: string): Promise<ServiceResult<void>>;
}
//# sourceMappingURL=taskService.d.ts.map