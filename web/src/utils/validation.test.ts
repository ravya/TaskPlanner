import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const taskTitleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(200, 'Title must be less than 200 characters');

export const taskDescriptionSchema = z
  .string()
  .max(5000, 'Description must be less than 5000 characters')
  .optional();

export const dateSchema = z
  .date()
  .or(z.string().transform((str) => new Date(str)))
  .refine((date) => !isNaN(date.getTime()), 'Invalid date');

export const futureDateSchema = dateSchema.refine(
  (date) => date > new Date(),
  'Date must be in the future'
);

describe('Validation Utilities', () => {
  describe('Email Validation', () => {
    it('should validate correct email', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
      expect(emailSchema.safeParse('user.name@domain.co.uk').success).toBe(true);
      expect(emailSchema.safeParse('user+tag@example.com').success).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(emailSchema.safeParse('').success).toBe(false);
      expect(emailSchema.safeParse('invalid').success).toBe(false);
      expect(emailSchema.safeParse('@example.com').success).toBe(false);
      expect(emailSchema.safeParse('test@').success).toBe(false);
      expect(emailSchema.safeParse('test @example.com').success).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should validate strong password', () => {
      expect(passwordSchema.safeParse('Password123').success).toBe(true);
      expect(passwordSchema.safeParse('MyP@ssw0rd').success).toBe(true);
    });

    it('should reject weak password', () => {
      // Too short
      expect(passwordSchema.safeParse('Pass1').success).toBe(false);

      // No uppercase
      expect(passwordSchema.safeParse('password123').success).toBe(false);

      // No lowercase
      expect(passwordSchema.safeParse('PASSWORD123').success).toBe(false);

      // No number
      expect(passwordSchema.safeParse('Password').success).toBe(false);
    });

    it('should provide specific error messages', () => {
      const result = passwordSchema.safeParse('short');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 8 characters');
      }
    });
  });

  describe('Task Title Validation', () => {
    it('should validate correct title', () => {
      expect(taskTitleSchema.safeParse('Valid Task Title').success).toBe(true);
      expect(taskTitleSchema.safeParse('A').success).toBe(true);
    });

    it('should reject empty title', () => {
      expect(taskTitleSchema.safeParse('').success).toBe(false);
    });

    it('should reject too long title', () => {
      const longTitle = 'A'.repeat(201);
      expect(taskTitleSchema.safeParse(longTitle).success).toBe(false);
    });
  });

  describe('Task Description Validation', () => {
    it('should validate correct description', () => {
      expect(taskDescriptionSchema.safeParse('Valid description').success).toBe(true);
      expect(taskDescriptionSchema.safeParse('').success).toBe(true);
      expect(taskDescriptionSchema.safeParse(undefined).success).toBe(true);
    });

    it('should reject too long description', () => {
      const longDesc = 'A'.repeat(5001);
      expect(taskDescriptionSchema.safeParse(longDesc).success).toBe(false);
    });
  });

  describe('Date Validation', () => {
    it('should validate valid date', () => {
      expect(dateSchema.safeParse(new Date()).success).toBe(true);
      expect(dateSchema.safeParse('2024-12-31').success).toBe(true);
      expect(dateSchema.safeParse('2024-01-01T10:00:00Z').success).toBe(true);
    });

    it('should reject invalid date', () => {
      expect(dateSchema.safeParse('invalid-date').success).toBe(false);
      expect(dateSchema.safeParse('').success).toBe(false);
    });
  });

  describe('Future Date Validation', () => {
    it('should validate future date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(futureDateSchema.safeParse(tomorrow).success).toBe(true);
    });

    it('should reject past date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(futureDateSchema.safeParse(yesterday).success).toBe(false);
    });
  });
});
