"use strict";
/**
 * TaskFlow Task Management HTTP Handlers
 * Express routes for task CRUD operations and management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskHandlers = void 0;
const express_1 = require("express");
const taskService_1 = require("../services/taskService");
const tagService_1 = require("../services/tagService");
const notificationService_1 = require("../services/notificationService");
const authHandlers_1 = require("./authHandlers");
const types_1 = require("../types");
exports.taskHandlers = (0, express_1.Router)();
// Initialize services
const taskService = new taskService_1.TaskService();
const tagService = new tagService_1.TagService();
const notificationService = new notificationService_1.NotificationService();
// Apply authentication middleware to all task routes
exports.taskHandlers.use(authHandlers_1.authenticateUser);
// =============================================================================
// TASK ROUTES
// =============================================================================
/**
 * GET /tasks
 * Get user tasks with filtering
 */
exports.taskHandlers.get('/', async (req, res) => {
    try {
        const userId = req.user.uid;
        console.log('📋 Getting tasks for user:', userId);
        // Parse basic query parameters
        const options = {};
        if (req.query.status) {
            options.status = req.query.status;
        }
        if (req.query.priority) {
            options.priority = req.query.priority;
        }
        const result = await taskService.getUserTasks(userId, options);
        if (!result.success) {
            res.status(500).json(result);
            return;
        }
        res.json(result);
    }
    catch (error) {
        console.error('❌ Get tasks error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: types_1.ERROR_CODES.INTERNAL_ERROR,
        });
    }
});
/**
 * POST /tasks
 * Create a new task
 */
exports.taskHandlers.post('/', async (req, res) => {
    try {
        const userId = req.user.uid;
        const taskData = req.body;
        console.log('📝 Creating task for user:', userId);
        // Convert date string to Date if provided
        if (taskData.dueDate) {
            taskData.dueDate = new Date(taskData.dueDate);
        }
        const result = await taskService.createTask(userId, taskData);
        if (!result.success) {
            res.status(400).json(result);
            return;
        }
        // Schedule notifications if the task has a deadline
        if (result.data.dueDate) {
            await notificationService.scheduleTaskNotifications(result.data);
        }
        console.log('✅ Task created successfully:', result.data.id);
        res.status(201).json(result);
    }
    catch (error) {
        console.error('❌ Create task error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: types_1.ERROR_CODES.INTERNAL_ERROR,
        });
    }
});
/**
 * PUT /tasks/:taskId
 * Update a task
 */
exports.taskHandlers.put('/:taskId', async (req, res) => {
    try {
        const userId = req.user.uid;
        const { taskId } = req.params;
        const updateData = req.body;
        console.log('✏️ Updating task:', taskId);
        // Convert date string to Date if provided
        if (updateData.dueDate !== undefined && updateData.dueDate !== null) {
            updateData.dueDate = new Date(updateData.dueDate);
        }
        const result = await taskService.updateTask(userId, taskId, updateData);
        if (!result.success) {
            const statusCode = result.error === types_1.ERROR_CODES.TASK_NOT_FOUND ? 404 : 400;
            res.status(statusCode).json(result);
            return;
        }
        // Update notifications if deadline changed
        if (updateData.dueDate !== undefined) {
            await notificationService.cancelTaskNotifications(userId, taskId);
            if (result.data.dueDate) {
                await notificationService.scheduleTaskNotifications(result.data);
            }
        }
        console.log('✅ Task updated successfully');
        res.json(result);
    }
    catch (error) {
        console.error('❌ Update task error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: types_1.ERROR_CODES.INTERNAL_ERROR,
        });
    }
});
/**
 * DELETE /tasks/:taskId
 * Delete a task
 */
exports.taskHandlers.delete('/:taskId', async (req, res) => {
    try {
        const userId = req.user.uid;
        const { taskId } = req.params;
        console.log('🗑️ Deleting task:', taskId);
        const result = await taskService.deleteTask(userId, taskId);
        if (!result.success) {
            const statusCode = result.error === types_1.ERROR_CODES.TASK_NOT_FOUND ? 404 : 500;
            res.status(statusCode).json(result);
            return;
        }
        // Cancel any pending notifications
        await notificationService.cancelTaskNotifications(userId, taskId);
        console.log('✅ Task deleted successfully');
        res.json(result);
    }
    catch (error) {
        console.error('❌ Delete task error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: types_1.ERROR_CODES.INTERNAL_ERROR,
        });
    }
});
// =============================================================================
// TAG ROUTES
// =============================================================================
/**
 * GET /tasks/tags
 * Get all user tags
 */
exports.taskHandlers.get('/tags', async (req, res) => {
    try {
        const userId = req.user.uid;
        console.log('🏷️ Getting tags for user:', userId);
        const result = await tagService.getUserTags(userId);
        if (!result.success) {
            res.status(500).json(result);
            return;
        }
        res.json(result);
    }
    catch (error) {
        console.error('❌ Get tags error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: types_1.ERROR_CODES.INTERNAL_ERROR,
        });
    }
});
/**
 * POST /tasks/tags
 * Create a new tag
 */
exports.taskHandlers.post('/tags', async (req, res) => {
    try {
        const userId = req.user.uid;
        const tagData = req.body;
        console.log('🏷️ Creating tag for user:', userId);
        const result = await tagService.createTag(userId, tagData);
        if (!result.success) {
            res.status(400).json(result);
            return;
        }
        console.log('✅ Tag created successfully:', result.data.id);
        res.status(201).json(result);
    }
    catch (error) {
        console.error('❌ Create tag error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: types_1.ERROR_CODES.INTERNAL_ERROR,
        });
    }
});
/**
 * PUT /tasks/tags/:tagId
 * Update a tag
 */
exports.taskHandlers.put('/tags/:tagId', async (req, res) => {
    try {
        const userId = req.user.uid;
        const { tagId } = req.params;
        const updateData = req.body;
        console.log('✏️ Updating tag:', tagId);
        const result = await tagService.updateTag(userId, tagId, updateData);
        if (!result.success) {
            const statusCode = result.error === types_1.ERROR_CODES.TAG_NOT_FOUND ? 404 : 400;
            res.status(statusCode).json(result);
            return;
        }
        console.log('✅ Tag updated successfully');
        res.json(result);
    }
    catch (error) {
        console.error('❌ Update tag error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: types_1.ERROR_CODES.INTERNAL_ERROR,
        });
    }
});
/**
 * DELETE /tasks/tags/:tagId
 * Delete a tag
 */
exports.taskHandlers.delete('/tags/:tagId', async (req, res) => {
    try {
        const userId = req.user.uid;
        const { tagId } = req.params;
        console.log('🗑️ Deleting tag:', tagId);
        const result = await tagService.deleteTag(userId, tagId);
        if (!result.success) {
            const statusCode = result.error === types_1.ERROR_CODES.TAG_NOT_FOUND ? 404 : 400;
            res.status(statusCode).json(result);
            return;
        }
        console.log('✅ Tag deleted successfully');
        res.json(result);
    }
    catch (error) {
        console.error('❌ Delete tag error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: types_1.ERROR_CODES.INTERNAL_ERROR,
        });
    }
});
/**
 * POST /tasks/notifications/register-token
 * Register device token for push notifications
 */
exports.taskHandlers.post('/notifications/register-token', async (req, res) => {
    try {
        const userId = req.user.uid;
        const { token, deviceType } = req.body;
        if (!token || !deviceType) {
            res.status(400).json({
                success: false,
                error: 'Token and deviceType are required',
                code: types_1.ERROR_CODES.MISSING_REQUIRED_FIELD,
            });
            return;
        }
        console.log('📱 Registering device token for user:', userId);
        const result = await notificationService.registerDeviceToken(userId, token, deviceType);
        if (!result.success) {
            res.status(400).json(result);
            return;
        }
        console.log('✅ Device token registered successfully');
        res.json(result);
    }
    catch (error) {
        console.error('❌ Register token error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: types_1.ERROR_CODES.INTERNAL_ERROR,
        });
    }
});
/**
 * Error handling middleware for task routes
 */
exports.taskHandlers.use((error, req, res, next) => {
    console.error('❌ Task handler error:', error);
    if (res.headersSent) {
        return next(error);
    }
    res.status(500).json({
        success: false,
        error: 'Task service error',
        code: types_1.ERROR_CODES.INTERNAL_ERROR,
    });
});
//# sourceMappingURL=taskHandlers.js.map