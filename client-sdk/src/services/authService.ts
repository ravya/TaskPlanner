/**
 * TaskFlow Client-Side Authentication Service
 * Handles Firebase Auth integration and user management
 */

import { Auth, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { Firestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import EventEmitter from 'eventemitter3';

import { UserProfile, CreateUserData, UpdateUserData, ServiceResult, ERROR_CODES } from '../types';
import { TaskFlowConfig } from '../index';

interface AuthEvents {
  'login': { userId: string; email: string };
  'logout': void;
  'profileUpdated': { userId: string };
  'error': { error: string; code?: string };
}

export class AuthService extends EventEmitter<AuthEvents> {
  private auth: Auth;
  private firestore: Firestore;
  private config: TaskFlowConfig;

  constructor(auth: Auth, firestore: Firestore, config: TaskFlowConfig) {
    super();
    this.auth = auth;
    this.firestore = firestore;
    this.config = config;
  }

  /**
   * Register a new user
   */
  async register(userData: CreateUserData & { password: string }): Promise<ServiceResult<UserProfile>> {
    try {
      this.log('info', 'Registering new user:', userData.email);
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;
      
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: userData.displayName,
        photoURL: userData.photoURL || null,
      });
      
      // Create user profile document
      const userProfile: UserProfile = {
        userId: user.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL || null,
        createdAt: new Date() as any, // Will be converted to Firestore Timestamp
        lastActiveAt: new Date() as any,
        preferences: {
          theme: 'light',
          notifications: true,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          defaultNotificationTime: 60,
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          ...userData.preferences,
        },
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          activeTasks: 0,
          overdueTasks: 0,
          currentStreak: 0,
          longestStreak: 0,
          averageCompletionTime: 0,
          totalTimeTracked: 0,
        },
        isActive: true,
        version: 1,
      };
      
      // Save to Firestore
      await setDoc(doc(this.firestore, 'users', user.uid), userProfile);
      
      this.log('info', 'User registered successfully:', user.uid);
      this.emit('login', { userId: user.uid, email: user.email! });
      
      return {
        success: true,
        data: userProfile,
      };
      
    } catch (error: any) {
      this.log('error', 'Registration failed:', error);
      
      let errorMessage = 'Registration failed';
      let errorCode: string = ERROR_CODES.INTERNAL_ERROR;
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email address is already in use';
        errorCode = ERROR_CODES.DUPLICATE_RESOURCE;
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
        errorCode = ERROR_CODES.INVALID_INPUT;
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
        errorCode = ERROR_CODES.INVALID_INPUT;
      }
      
      this.emit('error', { error: errorMessage, code: errorCode });
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string): Promise<ServiceResult<User>> {
    try {
      this.log('info', 'Signing in user:', email);
      
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Update last active timestamp
      await this.updateLastActive(user.uid);
      
      this.log('info', 'User signed in successfully:', user.uid);
      this.emit('login', { userId: user.uid, email: user.email! });
      
      return {
        success: true,
        data: user,
      };
      
    } catch (error: any) {
      this.log('error', 'Sign in failed:', error);
      
      let errorMessage = 'Sign in failed';
      let errorCode: string = ERROR_CODES.UNAUTHORIZED;
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
        errorCode = ERROR_CODES.UNAUTHORIZED;
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
        errorCode = ERROR_CODES.INVALID_INPUT;
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
        errorCode = ERROR_CODES.UNAUTHORIZED;
      }
      
      this.emit('error', { error: errorMessage, code: errorCode });
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<ServiceResult<void>> {
    try {
      this.log('info', 'Signing out user');
      
      await signOut(this.auth);
      
      this.log('info', 'User signed out successfully');
      this.emit('logout');
      
      return {
        success: true,
      };
      
    } catch (error: any) {
      this.log('error', 'Sign out failed:', error);
      
      this.emit('error', { error: 'Sign out failed', code: ERROR_CODES.INTERNAL_ERROR });
      
      return {
        success: false,
        error: 'Sign out failed',
        code: ERROR_CODES.INTERNAL_ERROR,
      };
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<ServiceResult<UserProfile>> {
    try {
      const user = this.auth.currentUser;
      
      if (!user) {
        return {
          success: false,
          error: 'No authenticated user',
          code: ERROR_CODES.UNAUTHORIZED,
        };
      }
      
      this.log('info', 'Getting user profile:', user.uid);
      
      const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
      
      if (!userDoc.exists()) {
        return {
          success: false,
          error: 'User profile not found',
          code: ERROR_CODES.USER_NOT_FOUND,
        };
      }
      
      const userData = userDoc.data() as UserProfile;
      
      return {
        success: true,
        data: userData,
      };
      
    } catch (error: any) {
      this.log('error', 'Failed to get user profile:', error);
      
      return {
        success: false,
        error: 'Failed to retrieve user profile',
        code: ERROR_CODES.DATABASE_ERROR,
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updateData: UpdateUserData): Promise<ServiceResult<UserProfile>> {
    try {
      const user = this.auth.currentUser;
      
      if (!user) {
        return {
          success: false,
          error: 'No authenticated user',
          code: ERROR_CODES.UNAUTHORIZED,
        };
      }
      
      this.log('info', 'Updating user profile:', user.uid);
      
      // Update Firebase Auth profile if needed
      if (updateData.displayName || updateData.photoURL !== undefined) {
        await updateProfile(user, {
          displayName: updateData.displayName || user.displayName,
          photoURL: updateData.photoURL !== undefined ? updateData.photoURL : user.photoURL,
        });
      }
      
      // Update Firestore document
      const updatePayload: any = {
        ...updateData,
        lastActiveAt: new Date(),
      };
      
      // Handle preferences update (merge with existing)
      if (updateData.preferences) {
        const currentProfile = await this.getCurrentUserProfile();
        if (currentProfile.success) {
          updatePayload.preferences = {
            ...currentProfile.data!.preferences,
            ...updateData.preferences,
          };
        }
      }
      
      await updateDoc(doc(this.firestore, 'users', user.uid), updatePayload);
      
      // Get updated profile
      const updatedProfile = await this.getCurrentUserProfile();
      
      if (updatedProfile.success) {
        this.emit('profileUpdated', { userId: user.uid });
      }
      
      this.log('info', 'User profile updated successfully');
      
      return updatedProfile;
      
    } catch (error: any) {
      this.log('error', 'Failed to update user profile:', error);
      
      this.emit('error', { error: 'Failed to update profile', code: ERROR_CODES.DATABASE_ERROR });
      
      return {
        success: false,
        error: 'Failed to update user profile',
        code: ERROR_CODES.DATABASE_ERROR,
      };
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  /**
   * Get ID token for API calls
   */
  async getIdToken(forceRefresh = false): Promise<string | null> {
    try {
      const user = this.auth.currentUser;
      
      if (!user) {
        return null;
      }
      
      return await user.getIdToken(forceRefresh);
      
    } catch (error: any) {
      this.log('error', 'Failed to get ID token:', error);
      return null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: TaskFlowConfig): void {
    this.config = config;
  }

  /**
   * Private helper methods
   */
  private async updateLastActive(userId: string): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, 'users', userId), {
        lastActiveAt: new Date(),
      });
    } catch (error) {
      this.log('warn', 'Failed to update last active timestamp:', error);
      // Don't throw error for this non-critical operation
    }
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    if (this.config.logLevel === 'debug' || 
        (this.config.logLevel === 'info' && level !== 'debug') ||
        (this.config.logLevel === 'warn' && (level === 'warn' || level === 'error')) ||
        (this.config.logLevel === 'error' && level === 'error')) {
      console[level](`[TaskFlow Auth] ${message}`, ...args);
    }
  }
}