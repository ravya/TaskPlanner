"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const admin = __importStar(require("firebase-admin"));
const types_1 = require("../types");
class TaskService {
    constructor() {
        this.db = admin.firestore();
    }
    async createTask(userId, taskData) {
        try {
            const taskRef = this.db.collection('tasks').doc();
            const now = admin.firestore.Timestamp.now();
            const task = {
                id: taskRef.id,
                userId,
                title: taskData.title,
                description: taskData.description || '',
                status: taskData.status || 'todo',
                priority: taskData.priority || 'medium',
                tags: taskData.tags || [],
                dueDate: taskData.dueDate || null,
                createdAt: now.toDate(),
                updatedAt: now.toDate(),
                completedAt: null,
            };
            await taskRef.set({
                ...task,
                createdAt: now,
                updatedAt: now,
            });
            return { success: true, data: task };
        }
        catch (error) {
            console.error('Error creating task:', error);
            return { success: false, error: types_1.ERROR_CODES.INTERNAL_ERROR };
        }
    }
    async getUserTasks(userId, options) {
        try {
            let query = this.db.collection('tasks').where('userId', '==', userId);
            if (options?.status) {
                query = query.where('status', '==', options.status);
            }
            if (options?.priority) {
                query = query.where('priority', '==', options.priority);
            }
            const querySnapshot = await query.get();
            const tasks = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                tasks.push({
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt.toDate(),
                    updatedAt: data.updatedAt.toDate(),
                    completedAt: data.completedAt ? data.completedAt.toDate() : null,
                });
            });
            return { success: true, data: tasks };
        }
        catch (error) {
            console.error('Error getting user tasks:', error);
            return { success: false, error: types_1.ERROR_CODES.INTERNAL_ERROR };
        }
    }
    async updateTask(userId, taskId, updateData) {
        try {
            const taskRef = this.db.collection('tasks').doc(taskId);
            const taskDoc = await taskRef.get();
            if (!taskDoc.exists) {
                return { success: false, error: types_1.ERROR_CODES.TASK_NOT_FOUND };
            }
            const taskData = taskDoc.data();
            if (taskData?.userId !== userId) {
                return { success: false, error: types_1.ERROR_CODES.UNAUTHORIZED };
            }
            const now = admin.firestore.Timestamp.now();
            const updates = {
                ...updateData,
                updatedAt: now,
            };
            if (updateData.status === 'completed' && taskData?.status !== 'completed') {
                updates.completedAt = now;
            }
            await taskRef.update(updates);
            const updatedDoc = await taskRef.get();
            const updatedData = updatedDoc.data();
            const updatedTask = {
                ...updatedData,
                id: updatedDoc.id,
                createdAt: updatedData?.createdAt.toDate(),
                updatedAt: updatedData?.updatedAt.toDate(),
                completedAt: updatedData?.completedAt ? updatedData.completedAt.toDate() : null,
            };
            return { success: true, data: updatedTask };
        }
        catch (error) {
            console.error('Error updating task:', error);
            return { success: false, error: types_1.ERROR_CODES.INTERNAL_ERROR };
        }
    }
    async deleteTask(userId, taskId) {
        try {
            const taskRef = this.db.collection('tasks').doc(taskId);
            const taskDoc = await taskRef.get();
            if (!taskDoc.exists) {
                return { success: false, error: types_1.ERROR_CODES.TASK_NOT_FOUND };
            }
            const taskData = taskDoc.data();
            if (taskData?.userId !== userId) {
                return { success: false, error: types_1.ERROR_CODES.UNAUTHORIZED };
            }
            await taskRef.delete();
            return { success: true, data: undefined };
        }
        catch (error) {
            console.error('Error deleting task:', error);
            return { success: false, error: types_1.ERROR_CODES.INTERNAL_ERROR };
        }
    }
}
exports.TaskService = TaskService;
//# sourceMappingURL=taskService.js.map