/**
 * TaskFlow Server-Side Authentication Service
 * Handles user registration, profile management, and authentication using Firebase Admin
 */

import * as admin from 'firebase-admin';
import { 
  UserProfile, 
  CreateUserData, 
  UpdateUserData, 
  ServiceResult,
  ERROR_CODES
} from '../types';

export class AuthService {
  private db: admin.firestore.Firestore;
  
  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Register a new user and create their profile document
   */
  async createUser(userData: CreateUserData): Promise<ServiceResult<UserProfile>> {
    try {
      console.log('🔐 Creating new user:', userData.email);
      
      // Create Firebase Auth user first
      let authUser;
      try {
        authUser = await admin.auth().createUser({
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL || null,
        });
      } catch (authError: any) {
        console.error('❌ Firebase Auth user creation failed:', authError);
        
        if (authError.code === 'auth/email-already-exists') {
          return {
            success: false,
            error: 'Email address is already in use',
            code: ERROR_CODES.DUPLICATE_RESOURCE,
          };
        }
        
        return {
          success: false,
          error: 'Failed to create authentication account',
          code: ERROR_CODES.INTERNAL_ERROR,
        };
      }
      
      // Create user profile document
      const now = new Date();
      const userProfile: UserProfile = {
        userId: authUser.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL || null,
        createdAt: now,
        updatedAt: now,
      };
      
      // Store with Firestore timestamps
      await this.db.doc(`users/${authUser.uid}`).set({
        ...userProfile,
        createdAt: admin.firestore.Timestamp.fromDate(now),
        updatedAt: admin.firestore.Timestamp.fromDate(now),
      });
      
      console.log('✅ User created successfully:', authUser.uid);
      
      return {
        success: true,
        data: userProfile,
      };
      
    } catch (error) {
      console.error('❌ Error creating user:', error);
      return {
        success: false,
        error: 'Internal server error',
        code: ERROR_CODES.INTERNAL_ERROR,
      };
    }
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<ServiceResult<UserProfile>> {
    try {
      console.log('👤 Getting user profile:', userId);
      
      const userDoc = await this.db.doc(`users/${userId}`).get();
      
      if (!userDoc.exists) {
        return {
          success: false,
          error: 'User not found',
          code: ERROR_CODES.USER_NOT_FOUND,
        };
      }
      
      const userData = userDoc.data();
      const userProfile: UserProfile = {
        ...userData,
        userId: userDoc.id,
        createdAt: userData?.createdAt?.toDate(),
        updatedAt: userData?.updatedAt?.toDate(),
      } as UserProfile;
      
      return {
        success: true,
        data: userProfile,
      };
      
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
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
  async updateUserProfile(userId: string, updateData: UpdateUserData): Promise<ServiceResult<UserProfile>> {
    try {
      console.log('✏️ Updating user profile:', userId);
      
      const userDoc = await this.db.doc(`users/${userId}`).get();
      
      if (!userDoc.exists) {
        return {
          success: false,
          error: 'User not found',
          code: ERROR_CODES.USER_NOT_FOUND,
        };
      }
      
      const now = admin.firestore.Timestamp.now();
      const updates = {
        ...updateData,
        updatedAt: now,
      };
      
      await this.db.doc(`users/${userId}`).update(updates);
      
      const updatedDoc = await this.db.doc(`users/${userId}`).get();
      const updatedData = updatedDoc.data();
      
      const updatedProfile: UserProfile = {
        ...updatedData,
        userId: updatedDoc.id,
        createdAt: updatedData?.createdAt?.toDate(),
        updatedAt: updatedData?.updatedAt?.toDate(),
      } as UserProfile;
      
      console.log('✅ User profile updated successfully');
      
      return {
        success: true,
        data: updatedProfile,
      };
      
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      return {
        success: false,
        error: 'Failed to update user profile',
        code: ERROR_CODES.DATABASE_ERROR,
      };
    }
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<ServiceResult<void>> {
    try {
      console.log('🗑️ Deleting user:', userId);
      
      const userDoc = await this.db.doc(`users/${userId}`).get();
      
      if (!userDoc.exists) {
        return {
          success: false,
          error: 'User not found',
          code: ERROR_CODES.USER_NOT_FOUND,
        };
      }
      
      // Delete user data from Firestore
      await this.db.doc(`users/${userId}`).delete();
      
      // Delete all user's tasks
      const tasksSnapshot = await this.db.collection('tasks')
        .where('userId', '==', userId)
        .get();
      
      const batch = this.db.batch();
      tasksSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete all user's tags
      const tagsSnapshot = await this.db.collection('tags')
        .where('userId', '==', userId)
        .get();
      
      tagsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      // Delete Firebase Auth user
      try {
        await admin.auth().deleteUser(userId);
      } catch (authError) {
        console.warn('⚠️ Failed to delete Firebase Auth user:', authError);
        // Continue anyway as the profile data is already deleted
      }
      
      console.log('✅ User deleted successfully');
      
      return {
        success: true,
        data: undefined,
      };
      
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      return {
        success: false,
        error: 'Failed to delete user account',
        code: ERROR_CODES.DATABASE_ERROR,
      };
    }
  }

  /**
   * Verify Firebase ID token
   */
  async verifyToken(token: string): Promise<ServiceResult<admin.auth.DecodedIdToken>> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return {
        success: true,
        data: decodedToken,
      };
    } catch (error: any) {
      console.error('❌ Token verification failed:', error);
      return {
        success: false,
        error: 'Invalid or expired token',
        code: ERROR_CODES.INVALID_TOKEN,
      };
    }
  }
}