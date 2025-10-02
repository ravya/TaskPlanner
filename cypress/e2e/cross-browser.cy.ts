/**
 * Cross-Browser Compatibility Tests
 * Testing application functionality across different browsers and viewport sizes
 */

import { TaskTestDataGenerator, UserTestDataGenerator } from '../../test-data/generators';

describe('Cross-Browser Compatibility', () => {
  let testUser: any;
  
  before(() => {
    testUser = UserTestDataGenerator.generateUser({
      email: 'crossbrowser@taskflow.app',
      uid: 'cross-browser-user'
    });
  });

  beforeEach(() => {
    cy.task('db:seed');
    cy.task('db:createUser', testUser);
  });

  const browsers = ['chrome', 'firefox', 'edge'];
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'large-desktop', width: 1920, height: 1080 }
  ];

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.login(testUser.email, 'TestPassword123!');
    });

    viewports.forEach(viewport => {
      context(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
        beforeEach(() => {
          cy.viewport(viewport.width, viewport.height);
          cy.visit('/dashboard');
        });

        it('should display navigation correctly', () => {
          if (viewport.width < 768) {
            // Mobile: Should show hamburger menu
            cy.get('[data-cy="mobile-menu-toggle"]').should('be.visible');
            cy.get('[data-cy="desktop-nav"]').should('not.be.visible');
          } else {
            // Tablet/Desktop: Should show full navigation
            cy.get('[data-cy="desktop-nav"]').should('be.visible');
            cy.get('[data-cy="mobile-menu-toggle"]').should('not.be.visible');
          }
        });

        it('should display task list appropriately', () => {
          const testTasks = Array.from({ length: 3 }, (_, i) =>
            TaskTestDataGenerator.generateTask({
              title: `Responsive Task ${i + 1}`,
              userId: testUser.uid
            })
          );

          cy.task('db:seedTasks', { userId: testUser.uid, tasks: testTasks });
          cy.reload();

          cy.get('[data-cy="task-list"]').should('be.visible');

          if (viewport.width < 768) {
            // Mobile: Tasks should stack vertically
            cy.get('[data-cy="task-item"]').should('have.css', 'width', '100%');
          } else if (viewport.width < 1024) {
            // Tablet: Two columns
            cy.get('[data-cy="task-grid"]').should('have.class', 'grid-cols-2');
          } else {
            // Desktop: Three or more columns
            cy.get('[data-cy="task-grid"]').should('have.class', 'grid-cols-3');
          }
        });

        it('should handle task creation modal correctly', () => {
          cy.get('[data-cy="create-task-btn"]').click();

          if (viewport.width < 768) {
            // Mobile: Full-screen modal
            cy.get('[data-cy="task-modal"]')
              .should('have.class', 'fullscreen')
              .should('have.css', 'width', '100vw');
          } else {
            // Tablet/Desktop: Centered modal
            cy.get('[data-cy="task-modal"]')
              .should('have.class', 'centered')
              .should('not.have.css', 'width', '100vw');
          }
        });

        it('should display filters appropriately', () => {
          if (viewport.width < 768) {
            // Mobile: Filters in collapsible section
            cy.get('[data-cy="filters-toggle"]').should('be.visible');
            cy.get('[data-cy="filters-panel"]').should('not.be.visible');
            
            cy.get('[data-cy="filters-toggle"]').click();
            cy.get('[data-cy="filters-panel"]').should('be.visible');
          } else {
            // Tablet/Desktop: Filters always visible
            cy.get('[data-cy="filters-panel"]').should('be.visible');
            cy.get('[data-cy="filters-toggle"]').should('not.exist');
          }
        });
      });
    });
  });

  describe('Touch and Mouse Interactions', () => {
    beforeEach(() => {
      cy.login(testUser.email, 'TestPassword123!');
      
      const touchTasks = [
        TaskTestDataGenerator.generateTask({
          title: 'Touch Interaction Task',
          userId: testUser.uid
        })
      ];

      cy.task('db:seedTasks', { userId: testUser.uid, tasks: touchTasks });
    });

    it('should handle swipe gestures on mobile', () => {
      cy.viewport(375, 667);
      cy.visit('/tasks');

      // Simulate swipe left to reveal actions
      cy.get('[data-cy="task-item"]')
        .first()
        .trigger('touchstart', { touches: [{ clientX: 300, clientY: 100 }] })
        .trigger('touchmove', { touches: [{ clientX: 100, clientY: 100 }] })
        .trigger('touchend');

      // Should reveal action buttons
      cy.get('[data-cy="swipe-actions"]').should('be.visible');
      cy.get('[data-cy="swipe-complete-btn"]').should('be.visible');
      cy.get('[data-cy="swipe-delete-btn"]').should('be.visible');
    });

    it('should handle hover states on desktop', () => {
      cy.viewport(1280, 720);
      cy.visit('/tasks');

      // Hover should reveal action buttons
      cy.get('[data-cy="task-item"]')
        .first()
        .trigger('mouseover');

      cy.get('[data-cy="task-actions"]').should('be.visible');
      cy.get('[data-cy="edit-task-btn"]').should('be.visible');
      cy.get('[data-cy="delete-task-btn"]').should('be.visible');
    });

    it('should handle drag and drop for task reordering', () => {
      cy.viewport(1280, 720);
      
      const dragTasks = Array.from({ length: 3 }, (_, i) =>
        TaskTestDataGenerator.generateTask({
          title: `Draggable Task ${i + 1}`,
          userId: testUser.uid
        })
      );

      cy.task('db:seedTasks', { userId: testUser.uid, tasks: dragTasks });
      cy.visit('/tasks');

      // Drag first task to third position
      cy.get('[data-cy="task-item"]').first().as('firstTask');
      cy.get('[data-cy="task-item"]').last().as('lastTask');

      cy.get('@firstTask')
        .trigger('dragstart');

      cy.get('@lastTask')
        .trigger('dragover')
        .trigger('drop');

      // Should reorder tasks
      cy.get('[data-cy="task-item"]')
        .last()
        .should('contain.text', 'Draggable Task 1');
    });
  });

  describe('Performance Across Devices', () => {
    it('should load within acceptable time limits', () => {
      cy.login(testUser.email, 'TestPassword123!');

      // Create a large dataset
      const largeTasks = Array.from({ length: 50 }, (_, i) =>
        TaskTestDataGenerator.generateTask({
          title: `Performance Task ${i + 1}`,
          userId: testUser.uid
        })
      );

      cy.task('db:seedTasks', { userId: testUser.uid, tasks: largeTasks });

      const startTime = Date.now();
      cy.visit('/tasks').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // Should load within 5 seconds
      });

      cy.get('[data-cy="task-list"]', { timeout: 5000 }).should('be.visible');
    });

    it('should handle rapid user interactions', () => {
      cy.login(testUser.email, 'TestPassword123!');
      cy.visit('/tasks');

      // Rapid task creation
      for (let i = 0; i < 5; i++) {
        cy.get('[data-cy="create-task-btn"]').click();
        cy.get('[data-cy="task-title-input"]').type(`Rapid Task ${i + 1}`);
        cy.get('[data-cy="submit-task-btn"]').click();
        cy.wait(100); // Small delay to prevent overwhelming
      }

      // Should handle all creations
      cy.get('[data-cy="task-item"]').should('have.length', 5);
    });
  });

  describe('Accessibility Across Browsers', () => {
    beforeEach(() => {
      cy.login(testUser.email, 'TestPassword123!');
      cy.visit('/tasks');
    });

    it('should support keyboard navigation consistently', () => {
      // Tab through interactive elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'create-task-btn');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy', 'search-input');

      // Enter should activate focused elements
      cy.focused().type('{enter}');
      cy.get('[data-cy="search-results"]').should('be.visible');
    });

    it('should announce screen reader content', () => {
      const testTask = TaskTestDataGenerator.generateTask({
        title: 'Screen Reader Task',
        userId: testUser.uid
      });

      cy.task('db:seedTasks', { userId: testUser.uid, tasks: [testTask] });
      cy.reload();

      // Should have proper ARIA labels
      cy.get('[data-cy="task-item"]')
        .first()
        .should('have.attr', 'role', 'listitem')
        .should('have.attr', 'aria-label');

      // Status changes should be announced
      cy.get('[data-cy="task-item"]')
        .first()
        .find('[data-cy="complete-task-btn"]')
        .click();

      cy.get('[role="alert"]').should('be.visible');
    });

    it('should maintain focus management in modals', () => {
      cy.get('[data-cy="create-task-btn"]').click();

      // Focus should be trapped in modal
      cy.get('[data-cy="task-title-input"]').should('be.focused');

      // Tab should cycle through modal elements
      cy.focused().tab().tab().tab();
      cy.focused().should('have.attr', 'data-cy', 'cancel-task-btn');

      // Escape should close modal and restore focus
      cy.get('body').type('{esc}');
      cy.get('[data-cy="task-modal"]').should('not.exist');
      cy.get('[data-cy="create-task-btn"]').should('be.focused');
    });
  });

  describe('Error Handling Consistency', () => {
    beforeEach(() => {
      cy.login(testUser.email, 'TestPassword123!');
    });

    it('should handle network errors consistently', () => {
      // Mock network failure
      cy.intercept('GET', '**/tasks**', { forceNetworkError: true }).as('networkError');

      cy.visit('/tasks');
      cy.wait('@networkError');

      // Should show error state
      cy.get('[data-cy="error-state"]').should('be.visible');
      cy.get('[data-cy="retry-btn"]').should('be.visible');
      
      // Error message should be accessible
      cy.get('[data-cy="error-message"]')
        .should('have.attr', 'role', 'alert')
        .should('be.visible');
    });

    it('should handle authentication errors consistently', () => {
      // Mock auth failure
      cy.intercept('GET', '**/tasks**', { statusCode: 401 }).as('authError');

      cy.visit('/tasks');
      cy.wait('@authError');

      // Should redirect to login
      cy.url().should('include', '/login');
      cy.get('[data-cy="session-expired-message"]').should('be.visible');
    });
  });

  describe('Feature Parity Across Browsers', () => {
    beforeEach(() => {
      cy.login(testUser.email, 'TestPassword123!');
    });

    it('should support all task operations', () => {
      const operations = [
        'create',
        'read', 
        'update',
        'delete',
        'filter',
        'search',
        'bulk-select'
      ];

      operations.forEach(operation => {
        cy.visit('/tasks');
        
        switch(operation) {
          case 'create':
            cy.get('[data-cy="create-task-btn"]').should('be.visible');
            break;
          case 'read':
            cy.get('[data-cy="task-list"]').should('be.visible');
            break;
          case 'update':
            cy.get('[data-cy="edit-task-btn"]').should('exist');
            break;
          case 'delete':
            cy.get('[data-cy="delete-task-btn"]').should('exist');
            break;
          case 'filter':
            cy.get('[data-cy="status-filter"]').should('be.visible');
            break;
          case 'search':
            cy.get('[data-cy="search-input"]').should('be.visible');
            break;
          case 'bulk-select':
            cy.get('[data-cy="bulk-select-checkbox"]').should('exist');
            break;
        }
      });
    });

    it('should support local storage consistently', () => {
      // Set user preferences
      cy.visit('/settings');
      cy.get('[data-cy="theme-select"]').select('dark');
      cy.get('[data-cy="save-settings-btn"]').click();

      // Should persist across page reloads
      cy.reload();
      cy.get('[data-cy="theme-select"]').should('have.value', 'dark');

      // Should persist across browser sessions
      cy.clearCookies();
      cy.visit('/settings');
      cy.get('[data-cy="theme-select"]').should('have.value', 'dark');
    });

    it('should handle date/time formatting correctly', () => {
      const taskWithDate = TaskTestDataGenerator.generateTask({
        title: 'Date Format Task',
        dueDate: new Date('2024-12-31T23:59:59.000Z'),
        userId: testUser.uid
      });

      cy.task('db:seedTasks', { userId: testUser.uid, tasks: [taskWithDate] });
      cy.visit('/tasks');

      // Should display date in user's locale
      cy.get('[data-cy="task-due-date"]')
        .should('be.visible')
        .should('contain.text', '2024'); // Year should be present regardless of format
    });
  });

  describe('Browser-Specific Features', () => {
    it('should handle browser notifications if supported', () => {
      cy.window().then(win => {
        if ('Notification' in win) {
          // Mock notification permission
          cy.stub(win.Notification, 'requestPermission').resolves('granted');

          cy.visit('/settings');
          cy.get('[data-cy="enable-notifications-toggle"]').click();

          cy.get('[data-cy="notification-permission-granted"]')
            .should('be.visible');
        }
      });
    });

    it('should handle offline functionality', () => {
      cy.visit('/tasks');
      
      // Mock offline state
      cy.window().then(win => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });

      // Should show offline indicator
      cy.get('[data-cy="offline-indicator"]').should('be.visible');

      // Should queue actions for when online
      cy.get('[data-cy="create-task-btn"]').click();
      cy.get('[data-cy="task-title-input"]').type('Offline Task');
      cy.get('[data-cy="submit-task-btn"]').click();

      cy.get('[data-cy="queued-actions-indicator"]')
        .should('be.visible')
        .should('contain.text', '1 action queued');
    });
  });
});