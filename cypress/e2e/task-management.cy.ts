/**
 * Task Management E2E Tests
 * Comprehensive testing of task CRUD operations and task management workflows
 */

import { TaskTestDataGenerator, UserTestDataGenerator } from '../../test-data/generators';

describe('Task Management', () => {
  let testUser: any;
  let authToken: string;
  
  beforeEach(() => {
    // Generate test user data
    testUser = UserTestDataGenerator.generateUser({
      email: 'test@taskflow.app',
      uid: 'test-user-e2e'
    });
    
    // Setup Firebase emulator connection
    cy.task('db:seed');
    
    // Mock authentication and login
    cy.login(testUser.email, 'testPassword123');
    
    // Visit the main app
    cy.visit('/');
  });

  describe('Task Creation', () => {
    it('should create a new task successfully', () => {
      const newTask = TaskTestDataGenerator.generateCreateTaskData({
        title: 'E2E Test Task',
        description: 'Created via Cypress E2E test',
        priority: 'high'
      });

      // Click the create task button
      cy.get('[data-cy="create-task-btn"]').click();
      
      // Fill in the task form
      cy.get('[data-cy="task-title-input"]').type(newTask.title);
      cy.get('[data-cy="task-description-input"]').type(newTask.description);
      cy.get('[data-cy="task-priority-select"]').select(newTask.priority);
      
      // Submit the form
      cy.get('[data-cy="submit-task-btn"]').click();
      
      // Verify task appears in the list
      cy.get('[data-cy="task-list"]')
        .should('contain.text', newTask.title)
        .should('contain.text', newTask.description);
      
      // Verify the task has correct priority styling
      cy.get(`[data-cy="task-item"]:contains("${newTask.title}")`)
        .should('have.class', `priority-${newTask.priority}`);
    });

    it('should create a task with due date and show deadline indicator', () => {
      const taskWithDeadline = TaskTestDataGenerator.generateCreateTaskData({
        title: 'Task with Deadline',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      });

      cy.get('[data-cy="create-task-btn"]').click();
      cy.get('[data-cy="task-title-input"]').type(taskWithDeadline.title);
      
      // Set due date
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const formattedDate = tomorrow.toISOString().split('T')[0];
      cy.get('[data-cy="task-due-date-input"]').type(formattedDate);
      
      cy.get('[data-cy="submit-task-btn"]').click();
      
      // Verify task shows deadline indicator
      cy.get(`[data-cy="task-item"]:contains("${taskWithDeadline.title}")`)
        .find('[data-cy="due-date-indicator"]')
        .should('be.visible');
    });

    it('should show validation errors for invalid task data', () => {
      cy.get('[data-cy="create-task-btn"]').click();
      
      // Try to submit without title
      cy.get('[data-cy="submit-task-btn"]').click();
      
      // Should show validation error
      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .should('contain.text', 'Title is required');
    });

    it('should create task with tags', () => {
      const taskWithTags = TaskTestDataGenerator.generateCreateTaskData({
        title: 'Tagged Task',
        tags: ['work', 'urgent']
      });

      cy.get('[data-cy="create-task-btn"]').click();
      cy.get('[data-cy="task-title-input"]').type(taskWithTags.title);
      
      // Add tags
      taskWithTags.tags.forEach(tag => {
        cy.get('[data-cy="task-tags-input"]').type(`${tag}{enter}`);
      });
      
      cy.get('[data-cy="submit-task-btn"]').click();
      
      // Verify tags appear on the task
      taskWithTags.tags.forEach(tag => {
        cy.get(`[data-cy="task-item"]:contains("${taskWithTags.title}")`)
          .find('[data-cy="task-tag"]')
          .should('contain.text', tag);
      });
    });
  });

  describe('Task Listing and Filtering', () => {
    beforeEach(() => {
      // Create test tasks with different properties
      const testTasks = [
        TaskTestDataGenerator.generateTask({ title: 'Todo Task', status: 'todo', priority: 'high' }),
        TaskTestDataGenerator.generateTask({ title: 'In Progress Task', status: 'in_progress', priority: 'medium' }),
        TaskTestDataGenerator.generateTask({ title: 'Completed Task', status: 'completed', priority: 'low' }),
        TaskTestDataGenerator.generateTask({ title: 'High Priority', status: 'todo', priority: 'high' }),
        TaskTestDataGenerator.generateTask({ title: 'Work Task', status: 'todo', tags: ['work'] })
      ];
      
      // Seed tasks in the database
      cy.task('db:seedTasks', { userId: testUser.uid, tasks: testTasks });
      cy.reload();
    });

    it('should display all tasks by default', () => {
      cy.get('[data-cy="task-item"]').should('have.length.at.least', 5);
    });

    it('should filter tasks by status', () => {
      // Filter by completed status
      cy.get('[data-cy="status-filter"]').select('completed');
      cy.get('[data-cy="task-item"]').should('have.length', 1);
      cy.get('[data-cy="task-item"]').should('contain.text', 'Completed Task');

      // Filter by in_progress status
      cy.get('[data-cy="status-filter"]').select('in_progress');
      cy.get('[data-cy="task-item"]').should('have.length', 1);
      cy.get('[data-cy="task-item"]').should('contain.text', 'In Progress Task');
    });

    it('should filter tasks by priority', () => {
      cy.get('[data-cy="priority-filter"]').select('high');
      cy.get('[data-cy="task-item"]').should('have.length', 2);
      cy.get('[data-cy="task-list"]')
        .should('contain.text', 'Todo Task')
        .should('contain.text', 'High Priority');
    });

    it('should search tasks by title', () => {
      cy.get('[data-cy="search-input"]').type('Work');
      cy.get('[data-cy="task-item"]').should('have.length', 1);
      cy.get('[data-cy="task-item"]').should('contain.text', 'Work Task');
    });

    it('should clear all filters', () => {
      // Apply filters
      cy.get('[data-cy="status-filter"]').select('completed');
      cy.get('[data-cy="priority-filter"]').select('high');
      cy.get('[data-cy="search-input"]').type('Test');
      
      // Clear filters
      cy.get('[data-cy="clear-filters-btn"]').click();
      
      // Should show all tasks again
      cy.get('[data-cy="task-item"]').should('have.length.at.least', 5);
    });
  });

  describe('Task Status Updates', () => {
    let testTask: any;

    beforeEach(() => {
      testTask = TaskTestDataGenerator.generateTask({
        title: 'Status Update Task',
        status: 'todo'
      });
      
      cy.task('db:seedTasks', { userId: testUser.uid, tasks: [testTask] });
      cy.reload();
    });

    it('should update task status to in_progress', () => {
      cy.get(`[data-cy="task-item"]:contains("${testTask.title}")`)
        .find('[data-cy="task-status-select"]')
        .select('in_progress');
      
      // Should update immediately
      cy.get(`[data-cy="task-item"]:contains("${testTask.title}")`)
        .should('have.class', 'status-in_progress');
    });

    it('should mark task as completed', () => {
      cy.get(`[data-cy="task-item"]:contains("${testTask.title}")`)
        .find('[data-cy="complete-task-btn"]')
        .click();
      
      // Should show completion animation/style
      cy.get(`[data-cy="task-item"]:contains("${testTask.title}")`)
        .should('have.class', 'status-completed');
      
      // Should show completion timestamp
      cy.get(`[data-cy="task-item"]:contains("${testTask.title}")`)
        .find('[data-cy="completed-at"]')
        .should('be.visible');
    });

    it('should mark task as completed from Dashboard today\'s tasks section on mobile', () => {
      // Visit dashboard
      cy.visit('/');
      
      // Create a task for today
      const todayTask = TaskTestDataGenerator.generateTask({
        title: 'Today Task for Mobile Test',
        status: 'todo',
        startDate: new Date().toISOString().split('T')[0]
      });
      
      cy.task('db:seedTasks', { userId: testUser.uid, tasks: [todayTask] });
      cy.reload();
      
      // Find the checkbox in today's tasks section and click it
      cy.get('input[type="checkbox"]')
        .first()
        .should('not.be.disabled')
        .check();
      
      // Task should be marked as completed
      cy.get('input[type="checkbox"]')
        .first()
        .should('be.checked');
    });

    it('should create next occurrence when repeating task is marked complete', () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const repeatingTask = TaskTestDataGenerator.generateTask({
        title: 'Daily Repeating Task',
        status: 'todo',
        startDate: today,
        isRepeating: true,
        repeatFrequency: 'daily',
        repeatEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      
      cy.task('db:seedTasks', { userId: testUser.uid, tasks: [repeatingTask] });
      cy.reload();
      
      // Mark the task as completed
      cy.get(`[data-cy="task-item"]:contains("${repeatingTask.title}")`)
        .find('input[type="checkbox"]')
        .check();
      
      // Wait for the next occurrence to be created
      cy.wait(1000);
      
      // Reload to see the new task
      cy.reload();
      
      // Should see the next occurrence for tomorrow
      cy.get('[data-cy="task-item"]')
        .contains('Daily Repeating Task')
        .should('exist');
    });

    it('should only show today\'s tasks in today\'s task list', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const tasks = [
        TaskTestDataGenerator.generateTask({
          title: 'Yesterday Task',
          status: 'todo',
          startDate: yesterday
        }),
        TaskTestDataGenerator.generateTask({
          title: 'Today Task',
          status: 'todo',
          startDate: today
        }),
        TaskTestDataGenerator.generateTask({
          title: 'Tomorrow Task',
          status: 'todo',
          startDate: tomorrow
        })
      ];
      
      cy.task('db:seedTasks', { userId: testUser.uid, tasks });
      cy.reload();
      
      // Visit dashboard
      cy.visit('/');
      
      // Today's tasks section should only show today's task
      cy.get('h2').contains("Today's Tasks").parent()
        .within(() => {
          cy.contains('Today Task').should('exist');
          cy.contains('Yesterday Task').should('not.exist');
          cy.contains('Tomorrow Task').should('not.exist');
        });
    });

    it('should handle status update errors gracefully', () => {
      // Mock API failure
      cy.intercept('PUT', '**/tasks/*', { statusCode: 500 }).as('updateTaskError');
      
      cy.get(`[data-cy="task-item"]:contains("${testTask.title}")`)
        .find('[data-cy="task-status-select"]')
        .select('completed');
      
      cy.wait('@updateTaskError');
      
      // Should show error message
      cy.get('[data-cy="error-notification"]')
        .should('be.visible')
        .should('contain.text', 'Failed to update task');
    });
  });

  describe('Task Editing', () => {
    let editableTask: any;

    beforeEach(() => {
      editableTask = TaskTestDataGenerator.generateTask({
        title: 'Editable Task',
        description: 'Original description',
        priority: 'medium'
      });
      
      cy.task('db:seedTasks', { userId: testUser.uid, tasks: [editableTask] });
      cy.reload();
    });

    it('should edit task details successfully', () => {
      // Open edit modal
      cy.get(`[data-cy="task-item"]:contains("${editableTask.title}")`)
        .find('[data-cy="edit-task-btn"]')
        .click();
      
      // Update task details
      cy.get('[data-cy="edit-task-title"]')
        .clear()
        .type('Updated Task Title');
      
      cy.get('[data-cy="edit-task-description"]')
        .clear()
        .type('Updated description');
      
      cy.get('[data-cy="edit-task-priority"]')
        .select('high');
      
      // Save changes
      cy.get('[data-cy="save-task-btn"]').click();
      
      // Verify changes
      cy.get('[data-cy="task-list"]')
        .should('contain.text', 'Updated Task Title')
        .should('contain.text', 'Updated description');
      
      cy.get(`[data-cy="task-item"]:contains("Updated Task Title")`)
        .should('have.class', 'priority-high');
    });

    it('should cancel edit operation', () => {
      cy.get(`[data-cy="task-item"]:contains("${editableTask.title}")`)
        .find('[data-cy="edit-task-btn"]')
        .click();
      
      // Make changes but cancel
      cy.get('[data-cy="edit-task-title"]')
        .clear()
        .type('This should not save');
      
      cy.get('[data-cy="cancel-edit-btn"]').click();
      
      // Should revert to original
      cy.get('[data-cy="task-list"]')
        .should('contain.text', editableTask.title)
        .should('not.contain.text', 'This should not save');
    });
  });

  describe('Task Deletion', () => {
    let deletableTask: any;

    beforeEach(() => {
      deletableTask = TaskTestDataGenerator.generateTask({
        title: 'Deletable Task'
      });
      
      cy.task('db:seedTasks', { userId: testUser.uid, tasks: [deletableTask] });
      cy.reload();
    });

    it('should delete task with confirmation', () => {
      // Click delete button
      cy.get(`[data-cy="task-item"]:contains("${deletableTask.title}")`)
        .find('[data-cy="delete-task-btn"]')
        .click();
      
      // Confirm deletion
      cy.get('[data-cy="confirm-delete-btn"]').click();
      
      // Task should be removed from list
      cy.get('[data-cy="task-list"]')
        .should('not.contain.text', deletableTask.title);
      
      // Should show success message
      cy.get('[data-cy="success-notification"]')
        .should('be.visible')
        .should('contain.text', 'Task deleted successfully');
    });

    it('should cancel task deletion', () => {
      cy.get(`[data-cy="task-item"]:contains("${deletableTask.title}")`)
        .find('[data-cy="delete-task-btn"]')
        .click();
      
      // Cancel deletion
      cy.get('[data-cy="cancel-delete-btn"]').click();
      
      // Task should still be in list
      cy.get('[data-cy="task-list"]')
        .should('contain.text', deletableTask.title);
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(() => {
      const bulkTasks = Array.from({ length: 5 }, (_, i) => 
        TaskTestDataGenerator.generateTask({
          title: `Bulk Task ${i + 1}`,
          status: 'todo'
        })
      );
      
      cy.task('db:seedTasks', { userId: testUser.uid, tasks: bulkTasks });
      cy.reload();
    });

    it('should select multiple tasks', () => {
      // Select first 3 tasks
      cy.get('[data-cy="task-checkbox"]').first().check();
      cy.get('[data-cy="task-checkbox"]').eq(1).check();
      cy.get('[data-cy="task-checkbox"]').eq(2).check();
      
      // Should show bulk actions
      cy.get('[data-cy="bulk-actions"]').should('be.visible');
      cy.get('[data-cy="selected-count"]').should('contain.text', '3 tasks selected');
    });

    it('should bulk mark tasks as completed', () => {
      // Select all tasks
      cy.get('[data-cy="select-all-checkbox"]').check();
      
      // Mark as completed
      cy.get('[data-cy="bulk-complete-btn"]').click();
      
      // All tasks should be marked as completed
      cy.get('[data-cy="task-item"]').each($el => {
        cy.wrap($el).should('have.class', 'status-completed');
      });
    });

    it('should bulk delete tasks', () => {
      // Select first 2 tasks
      cy.get('[data-cy="task-checkbox"]').first().check();
      cy.get('[data-cy="task-checkbox"]').eq(1).check();
      
      // Delete selected
      cy.get('[data-cy="bulk-delete-btn"]').click();
      cy.get('[data-cy="confirm-bulk-delete-btn"]').click();
      
      // Should have 3 tasks remaining
      cy.get('[data-cy="task-item"]').should('have.length', 3);
    });
  });

  describe('Task Notifications', () => {
    it('should show overdue task indicator', () => {
      const overdueTask = TaskTestDataGenerator.generateTask({
        title: 'Overdue Task',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        status: 'todo'
      });
      
      cy.task('db:seedTasks', { userId: testUser.uid, tasks: [overdueTask] });
      cy.reload();
      
      cy.get(`[data-cy="task-item"]:contains("${overdueTask.title}")`)
        .find('[data-cy="overdue-indicator"]')
        .should('be.visible')
        .should('have.class', 'overdue');
    });

    it('should show upcoming deadline warning', () => {
      const upcomingTask = TaskTestDataGenerator.generateTask({
        title: 'Due Soon Task',
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        status: 'todo'
      });
      
      cy.task('db:seedTasks', { userId: testUser.uid, tasks: [upcomingTask] });
      cy.reload();
      
      cy.get(`[data-cy="task-item"]:contains("${upcomingTask.title}")`)
        .find('[data-cy="due-soon-indicator"]')
        .should('be.visible')
        .should('have.class', 'due-soon');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Mock network failure
      cy.intercept('GET', '**/tasks**', { forceNetworkError: true }).as('networkError');
      
      cy.reload();
      cy.wait('@networkError');
      
      // Should show error message
      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .should('contain.text', 'Unable to load tasks');
      
      // Should show retry button
      cy.get('[data-cy="retry-btn"]').should('be.visible');
    });

    it('should retry failed operations', () => {
      // Mock initial failure then success
      cy.intercept('GET', '**/tasks**', { statusCode: 500 }).as('initialError');
      cy.intercept('GET', '**/tasks**', { fixture: 'tasks.json' }).as('retrySuccess');
      
      cy.reload();
      cy.wait('@initialError');
      
      // Click retry
      cy.get('[data-cy="retry-btn"]').click();
      cy.wait('@retrySuccess');
      
      // Should load tasks successfully
      cy.get('[data-cy="task-list"]').should('be.visible');
    });

    it('should handle authentication errors', () => {
      // Mock auth failure
      cy.intercept('GET', '**/tasks**', { statusCode: 401 }).as('authError');
      
      cy.reload();
      cy.wait('@authError');
      
      // Should redirect to login
      cy.url().should('include', '/login');
      cy.get('[data-cy="login-form"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      const accessibilityTask = TaskTestDataGenerator.generateTask({
        title: 'Accessibility Test Task'
      });
      
      cy.task('db:seedTasks', { userId: testUser.uid, tasks: [accessibilityTask] });
      cy.reload();
    });

    it('should be keyboard navigable', () => {
      // Tab through main interactive elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'create-task-btn');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy', 'search-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy', 'status-filter');
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-cy="task-item"]')
        .first()
        .should('have.attr', 'role', 'listitem');
      
      cy.get('[data-cy="task-checkbox"]')
        .first()
        .should('have.attr', 'aria-label');
      
      cy.get('[data-cy="create-task-btn"]')
        .should('have.attr', 'aria-label', 'Create new task');
    });

    it('should support screen reader announcements', () => {
      // Create new task
      cy.get('[data-cy="create-task-btn"]').click();
      cy.get('[data-cy="task-title-input"]').type('Screen Reader Test');
      cy.get('[data-cy="submit-task-btn"]').click();
      
      // Should announce success
      cy.get('[role="alert"]')
        .should('be.visible')
        .should('contain.text', 'Task created successfully');
    });
  });

  describe('Performance', () => {
    it('should handle large task lists efficiently', () => {
      // Create 100 test tasks
      const largeTasks = Array.from({ length: 100 }, (_, i) => 
        TaskTestDataGenerator.generateTask({
          title: `Performance Task ${i + 1}`,
          status: ['todo', 'in_progress', 'completed'][i % 3] as any
        })
      );
      
      cy.task('db:seedTasks', { userId: testUser.uid, tasks: largeTasks });
      cy.reload();
      
      // Should load within reasonable time
      cy.get('[data-cy="task-list"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="task-item"]').should('have.length.at.least', 50); // Assuming pagination
      
      // Search should be responsive
      cy.get('[data-cy="search-input"]').type('Performance Task 1');
      cy.get('[data-cy="task-item"]').should('have.length.at.most', 20);
    });
  });
});