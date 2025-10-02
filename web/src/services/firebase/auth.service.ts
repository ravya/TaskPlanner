import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  User,
  UserCredential,
  AuthError,
  getIdToken,
} from 'firebase/auth';
import { auth } from './config';

// Custom error types
export class AuthServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: AuthError
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

// User profile type
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
}

// Registration data type
export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
}

// Login data type
export interface LoginData {
  email: string;
  password: string;
}

// Password update data type
export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
}

// Profile update data type
export interface ProfileUpdateData {
  displayName?: string;
  photoURL?: string;
}

class AuthService {
  private googleProvider: GoogleAuthProvider;

  constructor() {
    this.googleProvider = new GoogleAuthProvider();
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('profile');
  }

  /**
   * Register a new user with email and password
   */
  async register(data: RegisterData): Promise<UserProfile> {
    try {
      const { email, password, displayName } = data;
      
      // Create user account
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName });

      // Send email verification
      await this.sendEmailVerification();

      return this.mapUserToProfile(user);
    } catch (error) {
      throw this.handleAuthError(error as AuthError, 'Registration failed');
    }
  }

  /**
   * Sign in with email and password
   */
  async login(data: LoginData): Promise<UserProfile> {
    try {
      const { email, password } = data;
      
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      return this.mapUserToProfile(userCredential.user);
    } catch (error) {
      throw this.handleAuthError(error as AuthError, 'Login failed');
    }
  }

  /**
   * Sign in with Google
   */
  async loginWithGoogle(): Promise<UserProfile> {
    try {
      const userCredential: UserCredential = await signInWithPopup(
        auth,
        this.googleProvider
      );

      return this.mapUserToProfile(userCredential.user);
    } catch (error) {
      throw this.handleAuthError(error as AuthError, 'Google login failed');
    }
  }

  /**
   * Sign out the current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw this.handleAuthError(error as AuthError, 'Logout failed');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleAuthError(error as AuthError, 'Password reset failed');
    }
  }

  /**
   * Send email verification to current user
   */
  async sendEmailVerification(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new AuthServiceError('No user is currently signed in');
      }

      await sendEmailVerification(user);
    } catch (error) {
      throw this.handleAuthError(error as AuthError, 'Email verification failed');
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(data: ProfileUpdateData): Promise<UserProfile> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new AuthServiceError('No user is currently signed in');
      }

      await updateProfile(user, data);
      
      return this.mapUserToProfile(user);
    } catch (error) {
      throw this.handleAuthError(error as AuthError, 'Profile update failed');
    }
  }

  /**
   * Update user email
   */
  async updateUserEmail(newEmail: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new AuthServiceError('No user is currently signed in');
      }

      await updateEmail(user, newEmail);
      await this.sendEmailVerification();
    } catch (error) {
      throw this.handleAuthError(error as AuthError, 'Email update failed');
    }
  }

  /**
   * Update user password
   */
  async updateUserPassword(data: PasswordUpdateData): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new AuthServiceError('No user is currently signed in');
      }

      const { currentPassword, newPassword } = data;

      // Reauthenticate user before password change
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
    } catch (error) {
      throw this.handleAuthError(error as AuthError, 'Password update failed');
    }
  }

  /**
   * Get current user's ID token
   */
  async getCurrentUserIdToken(forceRefresh = false): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      return await getIdToken(user, forceRefresh);
    } catch (error) {
      console.error('Failed to get ID token:', error);
      return null;
    }
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): UserProfile | null {
    const user = auth.currentUser;
    return user ? this.mapUserToProfile(user) : null;
  }

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      const userProfile = user ? this.mapUserToProfile(user) : null;
      callback(userProfile);
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Check if current user's email is verified
   */
  isEmailVerified(): boolean {
    return !!auth.currentUser?.emailVerified;
  }

  /**
   * Map Firebase User to UserProfile
   */
  private mapUserToProfile(user: User): UserProfile {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      createdAt: user.metadata.creationTime || new Date().toISOString(),
      lastLoginAt: user.metadata.lastSignInTime || new Date().toISOString(),
    };
  }

  /**
   * Handle and transform Firebase Auth errors
   */
  private handleAuthError(error: AuthError, defaultMessage: string): AuthServiceError {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email address',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/requires-recent-login': 'Please log in again to perform this action',
      'auth/popup-closed-by-user': 'Sign-in popup was closed',
      'auth/popup-blocked': 'Sign-in popup was blocked by the browser',
    };

    const message = errorMessages[error.code] || defaultMessage;
    
    return new AuthServiceError(message, error.code, error);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;