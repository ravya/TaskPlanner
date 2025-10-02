"use strict";
/**
 * TaskFlow Client-Side Authentication Service
 * Handles Firebase Auth integration and user management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const types_1 = require("../types");
class AuthService extends eventemitter3_1.default {
    constructor(auth, firestore, config) {
        super();
        this.auth = auth;
        this.firestore = firestore;
        this.config = config;
    }
    /**
     * Register a new user
     */
    async register(userData) {
        try {
            this.log('info', 'Registering new user:', userData.email);
            // Create Firebase Auth user
            const userCredential = await (0, auth_1.createUserWithEmailAndPassword)(this.auth, userData.email, userData.password);
            const user = userCredential.user;
            // Update Firebase Auth profile
            await (0, auth_1.updateProfile)(user, {
                displayName: userData.displayName,
                photoURL: userData.photoURL || null,
            });
            // Create user profile document
            const userProfile = {
                userId: user.uid,
                email: userData.email,
                displayName: userData.displayName,
                photoURL: userData.photoURL || null,
                createdAt: new Date(), // Will be converted to Firestore Timestamp
                lastActiveAt: new Date(),
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
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(this.firestore, 'users', user.uid), userProfile);
            this.log('info', 'User registered successfully:', user.uid);
            this.emit('login', { userId: user.uid, email: user.email });
            return {
                success: true,
                data: userProfile,
            };
        }
        catch (error) {
            this.log('error', 'Registration failed:', error);
            let errorMessage = 'Registration failed';
            let errorCode = types_1.ERROR_CODES.INTERNAL_ERROR;
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email address is already in use';
                errorCode = types_1.ERROR_CODES.DUPLICATE_RESOURCE;
            }
            else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak';
                errorCode = types_1.ERROR_CODES.INVALID_INPUT;
            }
            else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
                errorCode = types_1.ERROR_CODES.INVALID_INPUT;
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
    async signIn(email, password) {
        try {
            this.log('info', 'Signing in user:', email);
            const userCredential = await (0, auth_1.signInWithEmailAndPassword)(this.auth, email, password);
            const user = userCredential.user;
            // Update last active timestamp
            await this.updateLastActive(user.uid);
            this.log('info', 'User signed in successfully:', user.uid);
            this.emit('login', { userId: user.uid, email: user.email });
            return {
                success: true,
                data: user,
            };
        }
        catch (error) {
            this.log('error', 'Sign in failed:', error);
            let errorMessage = 'Sign in failed';
            let errorCode = types_1.ERROR_CODES.UNAUTHORIZED;
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Invalid email or password';
                errorCode = types_1.ERROR_CODES.UNAUTHORIZED;
            }
            else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
                errorCode = types_1.ERROR_CODES.INVALID_INPUT;
            }
            else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
                errorCode = types_1.ERROR_CODES.UNAUTHORIZED;
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
    async signOut() {
        try {
            this.log('info', 'Signing out user');
            await (0, auth_1.signOut)(this.auth);
            this.log('info', 'User signed out successfully');
            this.emit('logout');
            return {
                success: true,
            };
        }
        catch (error) {
            this.log('error', 'Sign out failed:', error);
            this.emit('error', { error: 'Sign out failed', code: types_1.ERROR_CODES.INTERNAL_ERROR });
            return {
                success: false,
                error: 'Sign out failed',
                code: types_1.ERROR_CODES.INTERNAL_ERROR,
            };
        }
    }
    /**
     * Get current user profile
     */
    async getCurrentUserProfile() {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                return {
                    success: false,
                    error: 'No authenticated user',
                    code: types_1.ERROR_CODES.UNAUTHORIZED,
                };
            }
            this.log('info', 'Getting user profile:', user.uid);
            const userDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(this.firestore, 'users', user.uid));
            if (!userDoc.exists()) {
                return {
                    success: false,
                    error: 'User profile not found',
                    code: types_1.ERROR_CODES.USER_NOT_FOUND,
                };
            }
            const userData = userDoc.data();
            return {
                success: true,
                data: userData,
            };
        }
        catch (error) {
            this.log('error', 'Failed to get user profile:', error);
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
    async updateUserProfile(updateData) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                return {
                    success: false,
                    error: 'No authenticated user',
                    code: types_1.ERROR_CODES.UNAUTHORIZED,
                };
            }
            this.log('info', 'Updating user profile:', user.uid);
            // Update Firebase Auth profile if needed
            if (updateData.displayName || updateData.photoURL !== undefined) {
                await (0, auth_1.updateProfile)(user, {
                    displayName: updateData.displayName || user.displayName,
                    photoURL: updateData.photoURL !== undefined ? updateData.photoURL : user.photoURL,
                });
            }
            // Update Firestore document
            const updatePayload = {
                ...updateData,
                lastActiveAt: new Date(),
            };
            // Handle preferences update (merge with existing)
            if (updateData.preferences) {
                const currentProfile = await this.getCurrentUserProfile();
                if (currentProfile.success) {
                    updatePayload.preferences = {
                        ...currentProfile.data.preferences,
                        ...updateData.preferences,
                    };
                }
            }
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(this.firestore, 'users', user.uid), updatePayload);
            // Get updated profile
            const updatedProfile = await this.getCurrentUserProfile();
            if (updatedProfile.success) {
                this.emit('profileUpdated', { userId: user.uid });
            }
            this.log('info', 'User profile updated successfully');
            return updatedProfile;
        }
        catch (error) {
            this.log('error', 'Failed to update user profile:', error);
            this.emit('error', { error: 'Failed to update profile', code: types_1.ERROR_CODES.DATABASE_ERROR });
            return {
                success: false,
                error: 'Failed to update user profile',
                code: types_1.ERROR_CODES.DATABASE_ERROR,
            };
        }
    }
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.auth.currentUser;
    }
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.auth.currentUser !== null;
    }
    /**
     * Get ID token for API calls
     */
    async getIdToken(forceRefresh = false) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                return null;
            }
            return await user.getIdToken(forceRefresh);
        }
        catch (error) {
            this.log('error', 'Failed to get ID token:', error);
            return null;
        }
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = config;
    }
    /**
     * Private helper methods
     */
    async updateLastActive(userId) {
        try {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(this.firestore, 'users', userId), {
                lastActiveAt: new Date(),
            });
        }
        catch (error) {
            this.log('warn', 'Failed to update last active timestamp:', error);
            // Don't throw error for this non-critical operation
        }
    }
    log(level, message, ...args) {
        if (this.config.logLevel === 'debug' ||
            (this.config.logLevel === 'info' && level !== 'debug') ||
            (this.config.logLevel === 'warn' && (level === 'warn' || level === 'error')) ||
            (this.config.logLevel === 'error' && level === 'error')) {
            console[level](`[TaskFlow Auth] ${message}`, ...args);
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map