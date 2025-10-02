/**
 * TaskFlow Server-Side Authentication Service
 * Handles user registration, profile management, and authentication using Firebase Admin
 */
import * as admin from 'firebase-admin';
import { UserProfile, CreateUserData, UpdateUserData, ServiceResult } from '../types';
export declare class AuthService {
    private db;
    constructor();
    /**
     * Register a new user and create their profile document
     */
    createUser(userData: CreateUserData): Promise<ServiceResult<UserProfile>>;
    /**
     * Get user profile by user ID
     */
    getUserProfile(userId: string): Promise<ServiceResult<UserProfile>>;
    /**
     * Update user profile
     */
    updateUserProfile(userId: string, updateData: UpdateUserData): Promise<ServiceResult<UserProfile>>;
    /**
     * Delete user account
     */
    deleteUser(userId: string): Promise<ServiceResult<void>>;
    /**
     * Verify Firebase ID token
     */
    verifyToken(token: string): Promise<ServiceResult<admin.auth.DecodedIdToken>>;
}
//# sourceMappingURL=authService.d.ts.map