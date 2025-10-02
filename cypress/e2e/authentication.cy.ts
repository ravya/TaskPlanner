/**
 * Authentication E2E Tests
 * Testing user registration, login, logout, and profile management
 */

import { UserTestDataGenerator } from '../../test-data/generators';

describe('Authentication', () => {
  beforeEach(() => {
    // Setup Firebase emulator connection
    cy.task('db:seed');
    cy.visit('/');
  });

  describe('User Registration', () => {
    beforeEach(() => {
      cy.visit('/register');
    });

    it('should register a new user successfully', () => {
      const newUser = UserTestDataGenerator.generateUser({
        email: 'newuser@taskflow.app',
        displayName: 'Test User'
      });

      // Fill registration form
      cy.get('[data-cy="register-email-input"]').type(newUser.email);
      cy.get('[data-cy="register-password-input"]').type('SecurePassword123!');
      cy.get('[data-cy="register-confirm-password-input"]').type('SecurePassword123!');
      cy.get('[data-cy="register-display-name-input"]').type(newUser.displayName);

      // Submit registration
      cy.get('[data-cy="register-submit-btn"]').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy="welcome-message"]')
        .should('be.visible')
        .should('contain.text', `Welcome, ${newUser.displayName}`);
    });

    it('should show validation errors for invalid registration data', () => {
      // Try to register with invalid email
      cy.get('[data-cy="register-email-input"]').type('invalid-email');
      cy.get('[data-cy="register-password-input"]').type('weak');
      cy.get('[data-cy="register-submit-btn"]').click();

      // Should show validation errors
      cy.get('[data-cy="email-error"]')
        .should('be.visible')
        .should('contain.text', 'Please enter a valid email address');

      cy.get('[data-cy="password-error"]')
        .should('be.visible')
        .should('contain.text', 'Password must be at least 8 characters');
    });

    it('should show error for mismatched passwords', () => {
      cy.get('[data-cy="register-email-input"]').type('test@example.com');
      cy.get('[data-cy="register-password-input"]').type('Password123!');
      cy.get('[data-cy="register-confirm-password-input"]').type('DifferentPassword123!');
      cy.get('[data-cy="register-submit-btn"]').click();

      cy.get('[data-cy="confirm-password-error"]')
        .should('be.visible')
        .should('contain.text', 'Passwords do not match');
    });

    it('should show error for existing email', () => {
      const existingUser = UserTestDataGenerator.generateUser({
        email: 'existing@taskflow.app'
      });

      // Create existing user
      cy.task('db:createUser', existingUser);

      // Try to register with same email
      cy.get('[data-cy="register-email-input"]').type(existingUser.email);
      cy.get('[data-cy="register-password-input"]').type('Password123!');
      cy.get('[data-cy="register-confirm-password-input"]').type('Password123!');
      cy.get('[data-cy="register-display-name-input"]').type('Test User');
      cy.get('[data-cy="register-submit-btn"]').click();

      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .should('contain.text', 'Email already in use');
    });

    it('should navigate to login page from registration', () => {
      cy.get('[data-cy="login-link"]').click();
      cy.url().should('include', '/login');
      cy.get('[data-cy="login-form"]').should('be.visible');
    });
  });

  describe('User Login', () => {
    let testUser: any;

    beforeEach(() => {
      testUser = UserTestDataGenerator.generateUser({
        email: 'testuser@taskflow.app',
        displayName: 'Test User'
      });

      // Create test user
      cy.task('db:createUser', testUser);
      cy.visit('/login');
    });

    it('should login with valid credentials', () => {
      cy.get('[data-cy="login-email-input"]').type(testUser.email);
      cy.get('[data-cy="login-password-input"]').type('TestPassword123!');
      cy.get('[data-cy="login-submit-btn"]').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy="user-avatar"]').should('be.visible');
      cy.get('[data-cy="user-display-name"]')
        .should('contain.text', testUser.displayName);
    });

    it('should show error for invalid credentials', () => {
      cy.get('[data-cy="login-email-input"]').type(testUser.email);
      cy.get('[data-cy="login-password-input"]').type('WrongPassword');
      cy.get('[data-cy="login-submit-btn"]').click();

      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .should('contain.text', 'Invalid email or password');
    });

    it('should show error for non-existent user', () => {
      cy.get('[data-cy="login-email-input"]').type('nonexistent@example.com');
      cy.get('[data-cy="login-password-input"]').type('Password123!');
      cy.get('[data-cy="login-submit-btn"]').click();

      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .should('contain.text', 'User not found');
    });

    it('should remember user on return visits', () => {
      // Login successfully
      cy.get('[data-cy="login-email-input"]').type(testUser.email);
      cy.get('[data-cy="login-password-input"]').type('TestPassword123!');
      cy.get('[data-cy="remember-me-checkbox"]').check();
      cy.get('[data-cy="login-submit-btn"]').click();

      // Navigate away and back
      cy.visit('/');

      // Should still be logged in
      cy.get('[data-cy="user-avatar"]').should('be.visible');
      cy.url().should('include', '/dashboard');
    });

    it('should navigate to registration page from login', () => {
      cy.get('[data-cy="register-link"]').click();
      cy.url().should('include', '/register');
      cy.get('[data-cy="register-form"]').should('be.visible');
    });
  });

  describe('Password Reset', () => {
    let testUser: any;

    beforeEach(() => {
      testUser = UserTestDataGenerator.generateUser({
        email: 'resetuser@taskflow.app'
      });

      cy.task('db:createUser', testUser);
      cy.visit('/login');
    });

    it('should send password reset email', () => {
      cy.get('[data-cy="forgot-password-link"]').click();
      cy.url().should('include', '/forgot-password');

      cy.get('[data-cy="reset-email-input"]').type(testUser.email);
      cy.get('[data-cy="send-reset-btn"]').click();

      cy.get('[data-cy="success-message"]')
        .should('be.visible')
        .should('contain.text', 'Password reset email sent');
    });

    it('should show error for non-existent email', () => {
      cy.get('[data-cy="forgot-password-link"]').click();

      cy.get('[data-cy="reset-email-input"]').type('nonexistent@example.com');
      cy.get('[data-cy="send-reset-btn"]').click();

      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .should('contain.text', 'No user found with this email');
    });
  });

  describe('User Logout', () => {
    beforeEach(() => {
      const loggedInUser = UserTestDataGenerator.generateUser({
        email: 'loggeduser@taskflow.app'
      });

      cy.task('db:createUser', loggedInUser);
      cy.login(loggedInUser.email, 'TestPassword123!');
      cy.visit('/dashboard');
    });

    it('should logout successfully', () => {
      // Open user menu
      cy.get('[data-cy="user-menu-toggle"]').click();
      cy.get('[data-cy="logout-btn"]').click();

      // Should redirect to login page
      cy.url().should('include', '/login');
      cy.get('[data-cy="login-form"]').should('be.visible');

      // Should not be able to access protected routes
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should clear user data on logout', () => {
      cy.get('[data-cy="user-menu-toggle"]').click();
      cy.get('[data-cy="logout-btn"]').click();

      // Local storage should be cleared
      cy.window().its('localStorage').invoke('getItem', 'authToken').should('be.null');
    });
  });

  describe('Profile Management', () => {
    let profileUser: any;

    beforeEach(() => {
      profileUser = UserTestDataGenerator.generateUser({
        email: 'profileuser@taskflow.app',
        displayName: 'Profile User'
      });

      cy.task('db:createUser', profileUser);
      cy.login(profileUser.email, 'TestPassword123!');
      cy.visit('/profile');
    });

    it('should display current profile information', () => {
      cy.get('[data-cy="profile-email"]').should('contain.text', profileUser.email);
      cy.get('[data-cy="profile-display-name"]').should('have.value', profileUser.displayName);
    });

    it('should update profile display name', () => {
      const newDisplayName = 'Updated Display Name';

      cy.get('[data-cy="profile-display-name"]')
        .clear()
        .type(newDisplayName);

      cy.get('[data-cy="save-profile-btn"]').click();

      cy.get('[data-cy="success-message"]')
        .should('be.visible')
        .should('contain.text', 'Profile updated successfully');

      // Verify name updated in header
      cy.get('[data-cy="user-display-name"]')
        .should('contain.text', newDisplayName);
    });

    it('should update profile avatar', () => {
      // Mock file upload
      cy.fixture('test-avatar.jpg').then(fileContent => {
        cy.get('[data-cy="avatar-upload-input"]').selectFile({
          contents: fileContent,
          fileName: 'avatar.jpg',
          mimeType: 'image/jpeg'
        }, { force: true });
      });

      cy.get('[data-cy="upload-avatar-btn"]').click();

      cy.get('[data-cy="success-message"]')
        .should('be.visible')
        .should('contain.text', 'Avatar updated successfully');

      // Verify new avatar appears
      cy.get('[data-cy="user-avatar"]')
        .should('have.attr', 'src')
        .and('not.be.empty');
    });

    it('should change password', () => {
      cy.get('[data-cy="change-password-btn"]').click();

      cy.get('[data-cy="current-password-input"]').type('TestPassword123!');
      cy.get('[data-cy="new-password-input"]').type('NewPassword123!');
      cy.get('[data-cy="confirm-new-password-input"]').type('NewPassword123!');

      cy.get('[data-cy="update-password-btn"]').click();

      cy.get('[data-cy="success-message"]')
        .should('be.visible')
        .should('contain.text', 'Password updated successfully');
    });

    it('should show error for incorrect current password', () => {
      cy.get('[data-cy="change-password-btn"]').click();

      cy.get('[data-cy="current-password-input"]').type('WrongPassword');
      cy.get('[data-cy="new-password-input"]').type('NewPassword123!');
      cy.get('[data-cy="confirm-new-password-input"]').type('NewPassword123!');

      cy.get('[data-cy="update-password-btn"]').click();

      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .should('contain.text', 'Current password is incorrect');
    });
  });

  describe('Session Management', () => {
    let sessionUser: any;

    beforeEach(() => {
      sessionUser = UserTestDataGenerator.generateUser({
        email: 'sessionuser@taskflow.app'
      });

      cy.task('db:createUser', sessionUser);
    });

    it('should handle expired sessions', () => {
      // Login and get a token
      cy.login(sessionUser.email, 'TestPassword123!');
      cy.visit('/dashboard');

      // Mock expired token
      cy.window().then(win => {
        win.localStorage.setItem('authToken', 'expired-token');
      });

      // Make API call that should fail with 401
      cy.intercept('GET', '**/tasks**', { statusCode: 401 }).as('expiredToken');

      cy.reload();
      cy.wait('@expiredToken');

      // Should redirect to login
      cy.url().should('include', '/login');
      cy.get('[data-cy="session-expired-message"]')
        .should('be.visible')
        .should('contain.text', 'Your session has expired');
    });

    it('should handle concurrent sessions', () => {
      // Login in one tab
      cy.login(sessionUser.email, 'TestPassword123!');
      cy.visit('/dashboard');

      // Simulate login from another device
      cy.task('auth:invalidateUserSessions', sessionUser.uid);

      // Should detect session invalidation
      cy.reload();
      cy.url().should('include', '/login');
    });
  });

  describe('Authentication Guards', () => {
    it('should redirect unauthenticated users to login', () => {
      const protectedRoutes = ['/dashboard', '/tasks', '/profile', '/settings'];

      protectedRoutes.forEach(route => {
        cy.visit(route);
        cy.url().should('include', '/login');
      });
    });

    it('should redirect authenticated users from auth pages', () => {
      const authUser = UserTestDataGenerator.generateUser({
        email: 'authguard@taskflow.app'
      });

      cy.task('db:createUser', authUser);
      cy.login(authUser.email, 'TestPassword123!');

      const authRoutes = ['/login', '/register', '/forgot-password'];

      authRoutes.forEach(route => {
        cy.visit(route);
        cy.url().should('include', '/dashboard');
      });
    });
  });

  describe('Social Authentication', () => {
    it('should login with Google OAuth', () => {
      cy.visit('/login');

      // Mock Google OAuth response
      cy.window().then(win => {
        cy.stub(win, 'open').returns({
          location: { href: 'mock-oauth-success' }
        });
      });

      cy.get('[data-cy="google-login-btn"]').click();

      // Should handle OAuth callback
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy="user-avatar"]').should('be.visible');
    });

    it('should handle OAuth errors', () => {
      cy.visit('/login');

      // Mock OAuth error
      cy.intercept('POST', '**/auth/oauth**', { statusCode: 400, body: { error: 'OAuth failed' } });

      cy.get('[data-cy="google-login-btn"]').click();

      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .should('contain.text', 'Authentication failed');
    });
  });

  describe('Account Deletion', () => {
    let deleteUser: any;

    beforeEach(() => {
      deleteUser = UserTestDataGenerator.generateUser({
        email: 'deleteuser@taskflow.app'
      });

      cy.task('db:createUser', deleteUser);
      cy.login(deleteUser.email, 'TestPassword123!');
      cy.visit('/profile/delete-account');
    });

    it('should delete account with confirmation', () => {
      cy.get('[data-cy="delete-account-input"]').type('DELETE');
      cy.get('[data-cy="confirm-delete-password"]').type('TestPassword123!');
      cy.get('[data-cy="delete-account-btn"]').click();

      // Should show final confirmation
      cy.get('[data-cy="final-confirm-btn"]').click();

      // Should redirect to goodbye page
      cy.url().should('include', '/goodbye');
      cy.get('[data-cy="account-deleted-message"]')
        .should('be.visible')
        .should('contain.text', 'Your account has been deleted');
    });

    it('should cancel account deletion', () => {
      cy.get('[data-cy="delete-account-input"]').type('DELETE');
      cy.get('[data-cy="confirm-delete-password"]').type('TestPassword123!');
      cy.get('[data-cy="delete-account-btn"]').click();

      cy.get('[data-cy="cancel-delete-btn"]').click();

      // Should return to profile
      cy.url().should('include', '/profile');
      cy.get('[data-cy="profile-form"]').should('be.visible');
    });
  });
});