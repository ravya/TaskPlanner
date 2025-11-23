// User profile and authentication types
export type UserRole = 'user' | 'admin' | 'moderator';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: UserRole;
  emailVerified: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  preferences?: UserPreferences;
  metadata?: UserMetadata;
  provider?: AuthProvider;
  tokenExpiry?: number;
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  emailNotifications: EmailNotificationSettings;
  pushNotifications: PushNotificationSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
}

// Email notification settings
export interface EmailNotificationSettings {
  taskReminders: boolean;
  deadlineAlerts: boolean;
  teamUpdates: boolean;
  weeklyDigest: boolean;
  marketing: boolean;
  security: boolean;
}

// Push notification settings
export interface PushNotificationSettings {
  taskReminders: boolean;
  deadlineAlerts: boolean;
  teamUpdates: boolean;
  mentions: boolean;
  enabled: boolean;
}

// Privacy settings
export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'team';
  activityVisibility: 'public' | 'private' | 'team';
  allowDataCollection: boolean;
  allowAnalytics: boolean;
}

// Accessibility settings
export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

// User metadata
export interface UserMetadata {
  source: 'web' | 'mobile' | 'api';
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  onboardingComplete: boolean;
  onboardingSteps?: string[];
  featureFlags?: Record<string, boolean>;
  experiments?: Record<string, string>;
}

// Authentication provider types
export type AuthProvider = 'email' | 'google' | 'apple' | 'microsoft' | 'github';

// Login form data
export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Registration form data
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  acceptTerms?: boolean;
  marketingConsent?: boolean;
}

// Password reset data
export interface PasswordResetData {
  email: string;
}

// Password change data
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Email verification data
export interface EmailVerificationData {
  code: string;
  email: string;
}

// Profile update data
export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  preferences?: Partial<UserPreferences>;
}

// Authentication state
export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Authentication context
export interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<UserProfile>;
  register: (data: RegisterData) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  loginWithProvider: (provider: AuthProvider) => Promise<UserProfile>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<UserProfile>;
  changePassword: (data: PasswordChangeData) => Promise<void>;
  refreshToken: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

// Authentication errors
export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

// Common authentication error codes
export enum AuthErrorCode {
  INVALID_EMAIL = 'auth/invalid-email',
  USER_DISABLED = 'auth/user-disabled',
  USER_NOT_FOUND = 'auth/user-not-found',
  WRONG_PASSWORD = 'auth/wrong-password',
  EMAIL_ALREADY_EXISTS = 'auth/email-already-in-use',
  WEAK_PASSWORD = 'auth/weak-password',
  OPERATION_NOT_ALLOWED = 'auth/operation-not-allowed',
  INVALID_VERIFICATION_CODE = 'auth/invalid-verification-code',
  INVALID_VERIFICATION_ID = 'auth/invalid-verification-id',
  CODE_EXPIRED = 'auth/code-expired',
  TOO_MANY_REQUESTS = 'auth/too-many-requests',
  NETWORK_ERROR = 'auth/network-request-failed',
  INTERNAL_ERROR = 'auth/internal-error',
  UNAUTHORIZED = 'auth/unauthorized',
  FORBIDDEN = 'auth/forbidden',
  TOKEN_EXPIRED = 'auth/token-expired',
  INVALID_TOKEN = 'auth/invalid-token',
}

// Authentication form validation
export interface AuthFormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

// Social authentication data
export interface SocialAuthData {
  provider: AuthProvider;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
}

// Multi-factor authentication
export interface MFASettings {
  enabled: boolean;
  methods: MFAMethod[];
  backupCodes: string[];
}

// MFA methods
export interface MFAMethod {
  type: 'sms' | 'authenticator' | 'email';
  identifier: string; // phone number, app name, or email
  verified: boolean;
  createdAt: string;
  lastUsed?: string;
}

// Session information
export interface SessionInfo {
  id: string;
  deviceType: string;
  browser: string;
  os: string;
  ip: string;
  location?: string;
  current: boolean;
  createdAt: string;
  lastActivity: string;
}

// Authentication configuration
export interface AuthConfig {
  providers: AuthProvider[];
  passwordRequirements: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  sessionTimeout: number; // in minutes
  maxSessions: number;
  mfaRequired: boolean;
  emailVerificationRequired: boolean;
}

// Authentication events
export enum AuthEvent {
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGE = 'password_change',
  EMAIL_VERIFICATION = 'email_verification',
  PROFILE_UPDATE = 'profile_update',
  MFA_ENABLE = 'mfa_enable',
  MFA_DISABLE = 'mfa_disable',
  SESSION_EXPIRE = 'session_expire',
  ACCOUNT_DELETE = 'account_delete',
}

// Authentication event data
export interface AuthEventData {
  event: AuthEvent;
  userId: string;
  timestamp: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}