/**
 * TaskFlow Client-Side Authentication Service
 * Handles Firebase Auth integration and user management
 */
import { Auth, User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import EventEmitter from 'eventemitter3';
import { UserProfile, CreateUserData, UpdateUserData, ServiceResult } from '../types';
import { TaskFlowConfig } from '../index';
interface AuthEvents {
    'login': {
        userId: string;
        email: string;
    };
    'logout': void;
    'profileUpdated': {
        userId: string;
    };
    'error': {
        error: string;
        code?: string;
    };
}
export declare class AuthService extends EventEmitter<AuthEvents> {
    private auth;
    private firestore;
    private config;
    constructor(auth: Auth, firestore: Firestore, config: TaskFlowConfig);
    /**
     * Register a new user
     */
    register(userData: CreateUserData & {
        password: string;
    }): Promise<ServiceResult<UserProfile>>;
    /**
     * Sign in existing user
     */
    signIn(email: string, password: string): Promise<ServiceResult<User>>;
    /**
     * Sign out current user
     */
    signOut(): Promise<ServiceResult<void>>;
    /**
     * Get current user profile
     */
    getCurrentUserProfile(): Promise<ServiceResult<UserProfile>>;
    /**
     * Update user profile
     */
    updateUserProfile(updateData: UpdateUserData): Promise<ServiceResult<UserProfile>>;
    /**
     * Get current user
     */
    getCurrentUser(): User | null;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Get ID token for API calls
     */
    getIdToken(forceRefresh?: boolean): Promise<string | null>;
    /**
     * Update configuration
     */
    updateConfig(config: TaskFlowConfig): void;
    /**
     * Private helper methods
     */
    private updateLastActive;
    private log;
}
export {};
//# sourceMappingURL=authService.d.ts.map