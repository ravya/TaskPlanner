"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUCCESS_MESSAGES = exports.ERROR_CODES = void 0;
// Error codes
exports.ERROR_CODES = {
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    TASK_NOT_FOUND: 'TASK_NOT_FOUND',
    TAG_NOT_FOUND: 'TAG_NOT_FOUND',
    DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
    RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
    DATABASE_ERROR: 'DATABASE_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
};
exports.SUCCESS_MESSAGES = {
    USER_CREATED: 'User created successfully',
    USER_UPDATED: 'User profile updated successfully',
    TASK_CREATED: 'Task created successfully',
    TASK_UPDATED: 'Task updated successfully',
    TASK_COMPLETED: 'Task marked as completed',
    TASK_DELETED: 'Task deleted successfully',
    TAG_CREATED: 'Tag created successfully',
    TAG_UPDATED: 'Tag updated successfully',
    TAG_DELETED: 'Tag deleted successfully',
};
//# sourceMappingURL=index.js.map