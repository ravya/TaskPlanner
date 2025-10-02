/**
 * TaskFlow Database Validation Utilities
 * Input validation and schema checking functions
 */

import { VALIDATION_RULES, ERROR_CODES } from './constants';
import { CreateUserData, UpdateUserData } from '../schema/user.schema';
import { CreateTaskData, UpdateTaskData, TaskPriority, TaskStatus } from '../schema/task.schema';
import { CreateTagData, UpdateTagData } from '../schema/tag.schema';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  code?: string;
}

/**
 * User validation functions
 */
export const validateUser = {
  create: (data: CreateUserData): ValidationResult => {
    const errors: string[] = [];
    
    // Email validation
    if (!data.email) {
      errors.push('Email is required');
    } else if (!isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }
    
    // Display name validation
    if (!data.displayName) {
      errors.push('Display name is required');
    } else if (data.displayName.length > VALIDATION_RULES.USER_DISPLAY_NAME_MAX_LENGTH) {
      errors.push(`Display name must be ${VALIDATION_RULES.USER_DISPLAY_NAME_MAX_LENGTH} characters or less`);
    }
    
    // Photo URL validation (optional)
    if (data.photoURL && !isValidUrl(data.photoURL)) {
      errors.push('Invalid photo URL format');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      code: errors.length > 0 ? ERROR_CODES.INVALID_INPUT : undefined,
    };
  },
  
  update: (data: UpdateUserData): ValidationResult => {
    const errors: string[] = [];
    
    // Display name validation (optional for updates)
    if (data.displayName !== undefined) {
      if (!data.displayName) {
        errors.push('Display name cannot be empty');
      } else if (data.displayName.length > VALIDATION_RULES.USER_DISPLAY_NAME_MAX_LENGTH) {
        errors.push(`Display name must be ${VALIDATION_RULES.USER_DISPLAY_NAME_MAX_LENGTH} characters or less`);
      }
    }
    
    // Photo URL validation (optional)
    if (data.photoURL !== undefined && data.photoURL && !isValidUrl(data.photoURL)) {
      errors.push('Invalid photo URL format');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      code: errors.length > 0 ? ERROR_CODES.INVALID_INPUT : undefined,
    };
  },
};

/**
 * Task validation functions
 */
export const validateTask = {
  create: (data: CreateTaskData): ValidationResult => {
    const errors: string[] = [];
    
    // Title validation
    if (!data.title) {
      errors.push('Task title is required');
    } else if (data.title.length < VALIDATION_RULES.TASK_TITLE_MIN_LENGTH) {
      errors.push(`Task title must be at least ${VALIDATION_RULES.TASK_TITLE_MIN_LENGTH} character`);
    } else if (data.title.length > VALIDATION_RULES.TASK_TITLE_MAX_LENGTH) {
      errors.push(`Task title must be ${VALIDATION_RULES.TASK_TITLE_MAX_LENGTH} characters or less`);
    }
    
    // Description validation (optional)
    if (data.description && data.description.length > VALIDATION_RULES.TASK_DESCRIPTION_MAX_LENGTH) {
      errors.push(`Task description must be ${VALIDATION_RULES.TASK_DESCRIPTION_MAX_LENGTH} characters or less`);
    }
    
    // Priority validation (optional)
    if (data.priority && !isValidTaskPriority(data.priority)) {
      errors.push('Invalid task priority');
    }
    
    // Tags validation (optional)
    if (data.tags) {
      if (data.tags.length > VALIDATION_RULES.MAX_TAGS_PER_TASK) {
        errors.push(`Maximum ${VALIDATION_RULES.MAX_TAGS_PER_TASK} tags allowed per task`);
      }
      
      for (const tag of data.tags) {
        if (!isValidTagName(tag)) {
          errors.push(`Invalid tag name: ${tag}`);
        }
      }
    }
    
    // Due time validation (optional)
    if (data.dueTime && !isValidTimeFormat(data.dueTime)) {
      errors.push('Invalid due time format. Use HH:MM (24-hour format)');
    }
    
    // Estimated time validation (optional)
    if (data.estimatedTime !== undefined && (data.estimatedTime < 0 || data.estimatedTime > 24 * 60)) {
      errors.push('Estimated time must be between 0 and 1440 minutes (24 hours)');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      code: errors.length > 0 ? ERROR_CODES.INVALID_INPUT : undefined,
    };
  },
  
  update: (data: UpdateTaskData): ValidationResult => {
    const errors: string[] = [];
    
    // Title validation (optional for updates)
    if (data.title !== undefined) {
      if (!data.title) {
        errors.push('Task title cannot be empty');
      } else if (data.title.length < VALIDATION_RULES.TASK_TITLE_MIN_LENGTH) {
        errors.push(`Task title must be at least ${VALIDATION_RULES.TASK_TITLE_MIN_LENGTH} character`);
      } else if (data.title.length > VALIDATION_RULES.TASK_TITLE_MAX_LENGTH) {
        errors.push(`Task title must be ${VALIDATION_RULES.TASK_TITLE_MAX_LENGTH} characters or less`);
      }
    }
    
    // Description validation (optional)
    if (data.description !== undefined && data.description && data.description.length > VALIDATION_RULES.TASK_DESCRIPTION_MAX_LENGTH) {
      errors.push(`Task description must be ${VALIDATION_RULES.TASK_DESCRIPTION_MAX_LENGTH} characters or less`);
    }
    
    // Priority validation (optional)
    if (data.priority && !isValidTaskPriority(data.priority)) {
      errors.push('Invalid task priority');
    }
    
    // Status validation (optional)
    if (data.status && !isValidTaskStatus(data.status)) {
      errors.push('Invalid task status');
    }
    
    // Tags validation (optional)
    if (data.tags) {
      if (data.tags.length > VALIDATION_RULES.MAX_TAGS_PER_TASK) {
        errors.push(`Maximum ${VALIDATION_RULES.MAX_TAGS_PER_TASK} tags allowed per task`);
      }
      
      for (const tag of data.tags) {
        if (!isValidTagName(tag)) {
          errors.push(`Invalid tag name: ${tag}`);
        }
      }
    }
    
    // Due time validation (optional)
    if (data.dueTime !== undefined && data.dueTime && !isValidTimeFormat(data.dueTime)) {
      errors.push('Invalid due time format. Use HH:MM (24-hour format)');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      code: errors.length > 0 ? ERROR_CODES.INVALID_INPUT : undefined,
    };
  },
};

/**
 * Tag validation functions
 */
export const validateTag = {
  create: (data: CreateTagData): ValidationResult => {
    const errors: string[] = [];
    
    // Name validation
    if (!data.name) {
      errors.push('Tag name is required');
    } else if (!isValidTagName(data.name)) {
      errors.push('Tag name can only contain lowercase letters, numbers, hyphens, and underscores');
    } else if (data.name.length < VALIDATION_RULES.TAG_NAME_MIN_LENGTH) {
      errors.push(`Tag name must be at least ${VALIDATION_RULES.TAG_NAME_MIN_LENGTH} character`);
    } else if (data.name.length > VALIDATION_RULES.TAG_NAME_MAX_LENGTH) {
      errors.push(`Tag name must be ${VALIDATION_RULES.TAG_NAME_MAX_LENGTH} characters or less`);
    }
    
    // Display name validation (optional)
    if (data.displayName && data.displayName.length > VALIDATION_RULES.TAG_DISPLAY_NAME_MAX_LENGTH) {
      errors.push(`Tag display name must be ${VALIDATION_RULES.TAG_DISPLAY_NAME_MAX_LENGTH} characters or less`);
    }
    
    // Description validation (optional)
    if (data.description && data.description.length > VALIDATION_RULES.TAG_DESCRIPTION_MAX_LENGTH) {
      errors.push(`Tag description must be ${VALIDATION_RULES.TAG_DESCRIPTION_MAX_LENGTH} characters or less`);
    }
    
    // Color validation (optional)
    if (data.color && !isValidHexColor(data.color)) {
      errors.push('Invalid color format. Use hex format (#RRGGBB)');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      code: errors.length > 0 ? ERROR_CODES.INVALID_INPUT : undefined,
    };
  },
  
  update: (data: UpdateTagData): ValidationResult => {
    const errors: string[] = [];
    
    // Display name validation (optional)
    if (data.displayName !== undefined) {
      if (!data.displayName) {
        errors.push('Tag display name cannot be empty');
      } else if (data.displayName.length > VALIDATION_RULES.TAG_DISPLAY_NAME_MAX_LENGTH) {
        errors.push(`Tag display name must be ${VALIDATION_RULES.TAG_DISPLAY_NAME_MAX_LENGTH} characters or less`);
      }
    }
    
    // Description validation (optional)
    if (data.description !== undefined && data.description && data.description.length > VALIDATION_RULES.TAG_DESCRIPTION_MAX_LENGTH) {
      errors.push(`Tag description must be ${VALIDATION_RULES.TAG_DESCRIPTION_MAX_LENGTH} characters or less`);
    }
    
    // Color validation (optional)
    if (data.color && !isValidHexColor(data.color)) {
      errors.push('Invalid color format. Use hex format (#RRGGBB)');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      code: errors.length > 0 ? ERROR_CODES.INVALID_INPUT : undefined,
    };
  },
};

/**
 * Helper validation functions
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidTaskPriority(priority: string): priority is TaskPriority {
  return ['low', 'medium', 'high', 'critical'].includes(priority);
}

export function isValidTaskStatus(status: string): status is TaskStatus {
  return ['active', 'completed', 'archived'].includes(status);
}

export function isValidTagName(name: string): boolean {
  const tagNameRegex = /^[a-z0-9_-]+$/;
  return tagNameRegex.test(name) && 
         name.length >= VALIDATION_RULES.TAG_NAME_MIN_LENGTH && 
         name.length <= VALIDATION_RULES.TAG_NAME_MAX_LENGTH;
}

export function isValidHexColor(color: string): boolean {
  const hexColorRegex = /^#([0-9A-F]{6})$/i;
  return hexColorRegex.test(color);
}

export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(time);
}

export function sanitizeTagName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, VALIDATION_RULES.TAG_NAME_MAX_LENGTH);
}

export function sanitizeText(input: string, maxLength: number): string {
  return input.trim().slice(0, maxLength);
}