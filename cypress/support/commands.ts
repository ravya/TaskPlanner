/// <reference types="cypress" />

// Custom Commands for TaskFlow E2E Tests

// Login Command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.waitForFirebase();
  
  cy.get('[data-cy="login-email-input"]')
    .clear()
    .type(email);
  
  cy.get('[data-cy="login-password-input"]')
    .clear()
    .type(password);
  
  cy.get('[data-cy="login-submit-btn"]').click();
  
  // Wait for successful login and redirect
  cy.url().should('not.include', '/login');
  cy.get('[data-cy="user-avatar"]', { timeout: 10000 }).should('be.visible');
});

// Register Command
Cypress.Commands.add('register', (email: string, password: string, displayName: string) => {
  cy.visit('/register');
  cy.waitForFirebase();
  
  cy.get('[data-cy="register-display-name-input"]')
    .clear()
    .type(displayName);
  
  cy.get('[data-cy="register-email-input"]')
    .clear()
    .type(email);
  
  cy.get('[data-cy="register-password-input"]')
    .clear()
    .type(password);
  
  cy.get('[data-cy="register-confirm-password-input"]')
    .clear()
    .type(password);
  
  cy.get('[data-cy="register-submit-btn"]').click();
  
  // Wait for successful registration
  cy.url().should('not.include', '/register');
});

// Logout Command
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="user-menu-toggle"]').click();
  cy.get('[data-cy="logout-btn"]').click();
  
  // Verify logout
  cy.url().should('include', '/login');
  cy.get('[data-cy="login-form"]').should('be.visible');
});

// Create Task Command
Cypress.Commands.add('createTask', (taskData) => {
  const defaultTask = {
    title: 'Test Task',
    description: 'Test task description',
    priority: 'medium',
    dueDate: '',
    tags: []
  };
  
  const task = { ...defaultTask, ...taskData };
  
  // Open task creation modal
  cy.get('[data-cy="create-task-btn"]').click();
  cy.get('[data-cy="task-modal"]').should('be.visible');
  
  // Fill in task details
  cy.get('[data-cy="task-title-input"]')
    .clear()
    .type(task.title);
  
  if (task.description) {
    cy.get('[data-cy="task-description-input"]')
      .clear()
      .type(task.description);
  }
  
  // Set priority
  cy.get('[data-cy="task-priority-select"]').select(task.priority);
  
  // Set due date if provided
  if (task.dueDate) {
    cy.get('[data-cy="task-due-date-input"]').type(task.dueDate);
  }
  
  // Add tags if provided
  if (task.tags && task.tags.length > 0) {
    task.tags.forEach(tag => {
      cy.get('[data-cy="task-tags-input"]').type(`${tag}{enter}`);
    });
  }
  
  // Save task
  cy.get('[data-cy="submit-task-btn"]').click();
  
  // Verify task was created
  cy.get('[data-cy="task-modal"]').should('not.exist');
  cy.contains(task.title).should('be.visible');
});

// Wait for Firebase to load
Cypress.Commands.add('waitForFirebase', () => {
  cy.window().its('firebase', { timeout: 10000 }).should('exist');
  cy.wait(1000); // Give Firebase time to initialize
});

// Seed Database Command
Cypress.Commands.add('seedDatabase', () => {
  cy.task('log', 'Seeding test database...');
  
  // This would typically call a Firebase Admin SDK function
  // For now, we'll create a few test tasks via the UI
  const testTasks = [
    {
      title: 'Urgent Task',
      priority: 'high',
      description: 'This is an urgent test task'
    },
    {
      title: 'Normal Task',
      priority: 'medium',
      description: 'This is a normal test task'
    },
    {
      title: 'Low Priority Task',
      priority: 'low',
      description: 'This is a low priority test task'
    }
  ];
  
  testTasks.forEach(task => {
    cy.createTask(task);
    cy.wait(1000); // Wait between creations to avoid race conditions
  });
});

// Clear Database Command
Cypress.Commands.add('clearDatabase', () => {
  cy.task('log', 'Clearing test database...');
  cy.task('clearFirebaseData');
  
  // Also clear local storage
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Custom assertion helpers
Cypress.Commands.add('shouldHaveTask', (taskTitle: string) => {
  cy.get('[data-cy="task-list"]')
    .should('contain', taskTitle);
});

Cypress.Commands.add('shouldNotHaveTask', (taskTitle: string) => {
  cy.get('[data-cy="task-list"]')
    .should('not.contain', taskTitle);
});

// Error handling helpers
Cypress.Commands.add('shouldShowError', (errorMessage: string) => {
  cy.get('[data-cy="error-message"]')
    .should('be.visible')
    .and('contain', errorMessage);
});

Cypress.Commands.add('shouldShowSuccess', (successMessage: string) => {
  cy.get('[data-cy="success-message"]')
    .should('be.visible')
    .and('contain', successMessage);
});

// Responsive design helpers
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667); // iPhone SE
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024); // iPad
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720); // Desktop
});

// Database seeding commands for E2E tests
Cypress.Commands.add('seedTestUser', (userData: any) => {
  cy.task('db:createUser', userData);
});

Cypress.Commands.add('seedTestTasks', (userId: string, tasks: any[]) => {
  cy.task('db:seedTasks', { userId, tasks });
});

Cypress.Commands.add('seedTestTags', (userId: string, tags: any[]) => {
  cy.task('db:seedTags', { userId, tags });
});

// Tab navigation helper
Cypress.Commands.add('tab', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).trigger('keydown', { key: 'Tab' });
  return cy.focused();
});

// Extend Cypress interface
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<Element>;
      register(email: string, password: string, displayName: string): Chainable<Element>;
      logout(): Chainable<Element>;
      createTask(taskData: any): Chainable<Element>;
      waitForFirebase(): Chainable<Element>;
      seedDatabase(): Chainable<Element>;
      clearDatabase(): Chainable<Element>;
      shouldHaveTask(taskTitle: string): Chainable<Element>;
      shouldNotHaveTask(taskTitle: string): Chainable<Element>;
      shouldShowError(errorMessage: string): Chainable<Element>;
      shouldShowSuccess(successMessage: string): Chainable<Element>;
      setMobileViewport(): Chainable<Element>;
      setTabletViewport(): Chainable<Element>;
      setDesktopViewport(): Chainable<Element>;
      seedTestUser(userData: any): Chainable<Element>;
      seedTestTasks(userId: string, tasks: any[]): Chainable<Element>;
      seedTestTags(userId: string, tags: any[]): Chainable<Element>;
      tab(): Chainable<Element>;
    }
  }
}