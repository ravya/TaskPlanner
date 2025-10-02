// Cypress E2E Support File
import './commands';

// Global configurations
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that we don't care about in testing
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Firebase Emulator Connection Setup
beforeEach(() => {
  // Clear any existing auth state
  cy.window().then((win) => {
    if (win.localStorage) {
      win.localStorage.clear();
    }
    if (win.sessionStorage) {
      win.sessionStorage.clear();
    }
    if (win.indexedDB) {
      win.indexedDB.deleteDatabase('firebaseLocalStorageDb');
    }
  });

  // Set up Firebase emulator connection
  cy.visit('/', {
    onBeforeLoad: (win) => {
      // Ensure Firebase connects to emulators
      win.localStorage.setItem('debug', 'firebase*');
    }
  });
});

// Custom assertions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with email and password
       */
      login(email: string, password: string): Chainable<void>;
      
      /**
       * Custom command to register a new user
       */
      register(email: string, password: string, displayName: string): Chainable<void>;
      
      /**
       * Custom command to logout current user
       */
      logout(): Chainable<void>;
      
      /**
       * Custom command to create a test task
       */
      createTask(taskData: Partial<{
        title: string;
        description: string;
        priority: string;
        dueDate: string;
        tags: string[];
      }>): Chainable<void>;
      
      /**
       * Custom command to wait for Firebase to load
       */
      waitForFirebase(): Chainable<void>;
      
      /**
       * Custom command to seed test data
       */
      seedDatabase(): Chainable<void>;
      
      /**
       * Custom command to clear database
       */
      clearDatabase(): Chainable<void>;
    }
  }
}