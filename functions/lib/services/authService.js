"use strict";
/**
 * TaskFlow Server-Side Authentication Service
 * Handles user registration, profile management, and authentication using Firebase Admin
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
exports.AuthService = void 0;
const admin = __importStar(require("firebase-admin"));
const types_1 = require("../types");
class AuthService {
    constructor() {
        this.db = admin.firestore();
    }
    /**
     * Register a new user and create their profile document
     */
    async createUser(userData) {
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
            }
            catch (authError) {
                console.error('❌ Firebase Auth user creation failed:', authError);
                if (authError.code === 'auth/email-already-exists') {
                    return {
                        success: false,
                        error: 'Email address is already in use',
                        code: types_1.ERROR_CODES.DUPLICATE_RESOURCE,
                    };
                }
                return {
                    success: false,
                    error: 'Failed to create authentication account',
                    code: types_1.ERROR_CODES.INTERNAL_ERROR,
                };
            }
            // Create user profile document
            const now = new Date();
            const userProfile = {
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
        }
        catch (error) {
            console.error('❌ Error creating user:', error);
            return {
                success: false,
                error: 'Internal server error',
                code: types_1.ERROR_CODES.INTERNAL_ERROR,
            };
        }
    }
    /**
     * Get user profile by user ID
     */
    async getUserProfile(userId) {
        try {
            console.log('👤 Getting user profile:', userId);
            const userDoc = await this.db.doc(`users/${userId}`).get();
            if (!userDoc.exists) {
                return {
                    success: false,
                    error: 'User not found',
                    code: types_1.ERROR_CODES.USER_NOT_FOUND,
                };
            }
            const userData = userDoc.data();
            const userProfile = {
                ...userData,
                userId: userDoc.id,
                createdAt: userData?.createdAt?.toDate(),
                updatedAt: userData?.updatedAt?.toDate(),
            };
            return {
                success: true,
                data: userProfile,
            };
        }
        catch (error) {
            console.error('❌ Error getting user profile:', error);
            return {
                success: false,
                error: 'Failed to retrieve user profile',
                code: types_1.ERROR_CODES.DATABASE_ERROR,
            };
        }
    }
    /**
     * Update user profile
     */
    async updateUserProfile(userId, updateData) {
        try {
            console.log('✏️ Updating user profile:', userId);
            const userDoc = await this.db.doc(`users/${userId}`).get();
            if (!userDoc.exists) {
                return {
                    success: false,
                    error: 'User not found',
                    code: types_1.ERROR_CODES.USER_NOT_FOUND,
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
            const updatedProfile = {
                ...updatedData,
                userId: updatedDoc.id,
                createdAt: updatedData?.createdAt?.toDate(),
                updatedAt: updatedData?.updatedAt?.toDate(),
            };
            console.log('✅ User profile updated successfully');
            return {
                success: true,
                data: updatedProfile,
            };
        }
        catch (error) {
            console.error('❌ Error updating user profile:', error);
            return {
                success: false,
                error: 'Failed to update user profile',
                code: types_1.ERROR_CODES.DATABASE_ERROR,
            };
        }
    }
    /**
     * Delete user account
     */
    async deleteUser(userId) {
        try {
            console.log('🗑️ Deleting user:', userId);
            const userDoc = await this.db.doc(`users/${userId}`).get();
            if (!userDoc.exists) {
                return {
                    success: false,
                    error: 'User not found',
                    code: types_1.ERROR_CODES.USER_NOT_FOUND,
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
            }
            catch (authError) {
                console.warn('⚠️ Failed to delete Firebase Auth user:', authError);
                // Continue anyway as the profile data is already deleted
            }
            console.log('✅ User deleted successfully');
            return {
                success: true,
                data: undefined,
            };
        }
        catch (error) {
            console.error('❌ Error deleting user:', error);
            return {
                success: false,
                error: 'Failed to delete user account',
                code: types_1.ERROR_CODES.DATABASE_ERROR,
            };
        }
    }
    /**
     * Verify Firebase ID token
     */
    async verifyToken(token) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            return {
                success: true,
                data: decodedToken,
            };
        }
        catch (error) {
            console.error('❌ Token verification failed:', error);
            return {
                success: false,
                error: 'Invalid or expired token',
                code: types_1.ERROR_CODES.INVALID_TOKEN,
            };
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map