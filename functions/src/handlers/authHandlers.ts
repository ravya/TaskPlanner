/**
 * TaskFlow Authentication HTTP Handlers
 * Express routes for user authentication and profile management
 */

import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthService } from '../services/authService';
import { CreateUserData, UpdateUserData, ERROR_CODES } from '../types';

export const authHandlers = Router();
const authService = new AuthService();

/**
 * Middleware to verify Firebase ID token
 */
async function authenticateUser(req: Request, res: Response, next: any): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authorization header missing or invalid format',
        code: ERROR_CODES.UNAUTHORIZED,
      });
      return;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const verifyResult = await authService.verifyToken(token);
    if (!verifyResult.success) {
      res.status(401).json({
        success: false,
        error: verifyResult.error,
        code: verifyResult.code,
      });
      return;
    }
    
    // Add decoded token to request object
    (req as any).user = verifyResult.data;
    next();
    
  } catch (error) {
    console.error('❌ Authentication middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: ERROR_CODES.UNAUTHORIZED,
    });
  }
}

/**
 * POST /auth/register
 * Register a new user
 */
authHandlers.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📝 User registration request');
    
    const userData: CreateUserData = req.body;
    
    // Basic validation
    if (!userData.email || !userData.displayName) {
      res.status(400).json({
        success: false,
        error: 'Email and display name are required',
        code: ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
      return;
    }
    
    const result = await authService.createUser(userData);
    
    if (!result.success) {
      const statusCode = result.code === ERROR_CODES.DUPLICATE_RESOURCE ? 409 : 400;
      res.status(statusCode).json(result);
      return;
    }
    
    console.log('✅ User registered successfully:', result.data?.userId);
    res.status(201).json(result);
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * GET /auth/profile
 * Get current user profile
 */
authHandlers.get('/profile', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.uid;
    console.log('👤 Getting profile for user:', userId);
    
    const result = await authService.getUserProfile(userId);
    
    if (!result.success) {
      const statusCode = result.code === ERROR_CODES.USER_NOT_FOUND ? 404 : 500;
      res.status(statusCode).json(result);
      return;
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * PUT /auth/profile
 * Update user profile
 */
authHandlers.put('/profile', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.uid;
    const updateData: UpdateUserData = req.body;
    
    console.log('✏️ Updating profile for user:', userId);
    
    const result = await authService.updateUserProfile(userId, updateData);
    
    if (!result.success) {
      const statusCode = result.code === ERROR_CODES.USER_NOT_FOUND ? 404 : 400;
      res.status(statusCode).json(result);
      return;
    }
    
    console.log('✅ Profile updated successfully');
    res.json(result);
    
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * DELETE /auth/profile
 * Delete user account
 */
authHandlers.delete('/profile', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.uid;
    console.log('🗑️ Deleting account for user:', userId);
    
    const result = await authService.deleteUser(userId);
    
    if (!result.success) {
      const statusCode = result.code === ERROR_CODES.USER_NOT_FOUND ? 404 : 500;
      res.status(statusCode).json(result);
      return;
    }
    
    console.log('✅ Account deleted successfully');
    res.json(result);
    
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * GET /auth/stats
 * Get user statistics
 */
authHandlers.get('/stats', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.uid;
    console.log('📊 Getting stats for user:', userId);
    
    // TODO: Implement user statistics
    const result = {
      success: true,
      data: {
        totalTasks: 0,
        completedTasks: 0,
        totalTags: 0,
      }
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * POST /auth/refresh-token
 * Refresh user's last active timestamp
 */
authHandlers.post('/refresh-token', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.uid;
    
    // TODO: Implement updateLastActive method
    // await authService.updateLastActive(userId);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
    });
    
  } catch (error) {
    console.error('❌ Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * POST /auth/verify-token
 * Verify if a token is valid (for debugging/testing)
 */
authHandlers.post('/verify-token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token is required',
        code: ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
      return;
    }
    
    const result = await authService.verifyToken(token);
    
    if (!result.success) {
      res.status(401).json(result);
      return;
    }
    
    res.json({
      success: true,
      data: {
        uid: result.data?.uid,
        email: result.data?.email,
        email_verified: result.data?.email_verified,
        iss: result.data?.iss,
        aud: result.data?.aud,
        exp: result.data?.exp,
        iat: result.data?.iat,
      },
    });
    
  } catch (error) {
    console.error('❌ Verify token error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * Error handling middleware for auth routes
 */
authHandlers.use((error: any, req: Request, res: Response, next: any) => {
  console.error('❌ Auth handler error:', error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    success: false,
    error: 'Authentication service error',
    code: ERROR_CODES.INTERNAL_ERROR,
  });
});

// Export the authentication middleware for use in other handlers
export { authenticateUser };