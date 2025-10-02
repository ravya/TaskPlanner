"use strict";
/**
 * TaskFlow Date Utilities
 * Helper functions for date and time operations
 */
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
exports.now = now;
exports.dateToTimestamp = dateToTimestamp;
exports.timestampToDate = timestampToDate;
exports.addMinutes = addMinutes;
exports.addHours = addHours;
exports.addDays = addDays;
exports.isInPast = isInPast;
exports.isInFuture = isInFuture;
exports.differenceInMinutes = differenceInMinutes;
exports.differenceInHours = differenceInHours;
exports.differenceInDays = differenceInDays;
exports.isSameDay = isSameDay;
exports.startOfDay = startOfDay;
exports.endOfDay = endOfDay;
exports.formatTimestamp = formatTimestamp;
exports.combineDateTime = combineDateTime;
exports.extractTime = extractTime;
exports.isTaskOverdue = isTaskOverdue;
exports.getRelativeTime = getRelativeTime;
exports.getBusinessDaysBetween = getBusinessDaysBetween;
exports.convertTimezone = convertTimezone;
exports.getCurrentWeek = getCurrentWeek;
exports.getCurrentMonth = getCurrentMonth;
const admin = __importStar(require("firebase-admin"));
/**
 * Get current timestamp as Firestore Timestamp
 */
function now() {
    return admin.firestore.Timestamp.now();
}
/**
 * Convert Date to Firestore Timestamp
 */
function dateToTimestamp(date) {
    return admin.firestore.Timestamp.fromDate(date);
}
/**
 * Convert Firestore Timestamp to Date
 */
function timestampToDate(timestamp) {
    return timestamp.toDate();
}
/**
 * Add minutes to a timestamp
 */
function addMinutes(timestamp, minutes) {
    const date = timestamp.toDate();
    date.setMinutes(date.getMinutes() + minutes);
    return admin.firestore.Timestamp.fromDate(date);
}
/**
 * Add hours to a timestamp
 */
function addHours(timestamp, hours) {
    const date = timestamp.toDate();
    date.setHours(date.getHours() + hours);
    return admin.firestore.Timestamp.fromDate(date);
}
/**
 * Add days to a timestamp
 */
function addDays(timestamp, days) {
    const date = timestamp.toDate();
    date.setDate(date.getDate() + days);
    return admin.firestore.Timestamp.fromDate(date);
}
/**
 * Check if a timestamp is in the past
 */
function isInPast(timestamp) {
    return timestamp.toMillis() < Date.now();
}
/**
 * Check if a timestamp is in the future
 */
function isInFuture(timestamp) {
    return timestamp.toMillis() > Date.now();
}
/**
 * Get the difference in minutes between two timestamps
 */
function differenceInMinutes(start, end) {
    return Math.round((end.toMillis() - start.toMillis()) / (1000 * 60));
}
/**
 * Get the difference in hours between two timestamps
 */
function differenceInHours(start, end) {
    return Math.round((end.toMillis() - start.toMillis()) / (1000 * 60 * 60));
}
/**
 * Get the difference in days between two timestamps
 */
function differenceInDays(start, end) {
    return Math.round((end.toMillis() - start.toMillis()) / (1000 * 60 * 60 * 24));
}
/**
 * Check if two timestamps are on the same day
 */
function isSameDay(timestamp1, timestamp2) {
    const date1 = timestamp1.toDate();
    const date2 = timestamp2.toDate();
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
}
/**
 * Get start of day for a timestamp
 */
function startOfDay(timestamp) {
    const date = timestamp.toDate();
    date.setHours(0, 0, 0, 0);
    return admin.firestore.Timestamp.fromDate(date);
}
/**
 * Get end of day for a timestamp
 */
function endOfDay(timestamp) {
    const date = timestamp.toDate();
    date.setHours(23, 59, 59, 999);
    return admin.firestore.Timestamp.fromDate(date);
}
/**
 * Format timestamp to readable string
 */
function formatTimestamp(timestamp, format = 'datetime') {
    const date = timestamp.toDate();
    switch (format) {
        case 'date':
            return date.toLocaleDateString();
        case 'time':
            return date.toLocaleTimeString();
        case 'datetime':
            return date.toLocaleString();
        default:
            return date.toLocaleString();
    }
}
/**
 * Parse time string (HH:MM) and combine with date
 */
function combineDateTime(dateTimestamp, timeString) {
    const date = dateTimestamp.toDate();
    const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
    if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('Invalid time format. Expected HH:MM');
    }
    date.setHours(hours, minutes, 0, 0);
    return admin.firestore.Timestamp.fromDate(date);
}
/**
 * Get time string from timestamp (HH:MM format)
 */
function extractTime(timestamp) {
    const date = timestamp.toDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}
/**
 * Check if a task is overdue based on due date and time
 */
function isTaskOverdue(dueDate, dueTime) {
    const now = admin.firestore.Timestamp.now();
    if (!dueTime) {
        // If no specific time, consider overdue at end of the due date
        return endOfDay(dueDate).toMillis() < now.toMillis();
    }
    // Combine date and time for precise comparison
    const exactDueTime = combineDateTime(dueDate, dueTime);
    return exactDueTime.toMillis() < now.toMillis();
}
/**
 * Get relative time description (e.g., "2 hours ago", "in 3 days")
 */
function getRelativeTime(timestamp) {
    const now = Date.now();
    const targetTime = timestamp.toMillis();
    const diffMs = targetTime - now;
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const isPast = diffMs < 0;
    const absDiffMins = Math.abs(diffMins);
    const absDiffHours = Math.abs(diffHours);
    const absDiffDays = Math.abs(diffDays);
    if (absDiffMins < 1) {
        return 'now';
    }
    else if (absDiffMins < 60) {
        return isPast ? `${absDiffMins} minutes ago` : `in ${absDiffMins} minutes`;
    }
    else if (absDiffHours < 24) {
        return isPast ? `${absDiffHours} hours ago` : `in ${absDiffHours} hours`;
    }
    else if (absDiffDays === 1) {
        return isPast ? 'yesterday' : 'tomorrow';
    }
    else {
        return isPast ? `${absDiffDays} days ago` : `in ${absDiffDays} days`;
    }
}
/**
 * Get business days between two timestamps (excluding weekends)
 */
function getBusinessDaysBetween(start, end) {
    const startDate = start.toDate();
    const endDate = end.toDate();
    let count = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
}
/**
 * Convert timezone
 */
function convertTimezone(timestamp, timezone) {
    return timestamp.toDate().toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
/**
 * Get current week start and end timestamps
 */
function getCurrentWeek() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek); // Go to Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Go to Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    return {
        start: admin.firestore.Timestamp.fromDate(startOfWeek),
        end: admin.firestore.Timestamp.fromDate(endOfWeek),
    };
}
/**
 * Get current month start and end timestamps
 */
function getCurrentMonth() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
        start: admin.firestore.Timestamp.fromDate(startOfMonth),
        end: admin.firestore.Timestamp.fromDate(endOfMonth),
    };
}
//# sourceMappingURL=dateUtils.js.map