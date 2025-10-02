/**
 * Tag Management E2E Tests
 * Testing tag creation, editing, deletion, and task tagging functionality
 */

import { TagTestDataGenerator, TaskTestDataGenerator, UserTestDataGenerator } from '../../test-data/generators';

describe('Tag Management', () => {
  let testUser: any;
  
  beforeEach(() => {
    testUser = UserTestDataGenerator.generateUser({
      email: 'taguser@taskflow.app',
      uid: 'tag-test-user'
    });
    
    cy.task('db:seed');
    cy.task('db:createUser', testUser);
    cy.login(testUser.email, 'TestPassword123!');
    cy.visit('/tags');
  });

  describe('Tag Creation', () => {
    it('should create a new tag successfully', () => {
      const newTag = TagTestDataGenerator.generateCreateTagData({
        name: 'Work',
        color: '#3B82F6'
      });

      cy.get('[data-cy="create-tag-btn"]').click();
      cy.get('[data-cy="tag-name-input"]').type(newTag.name);
      cy.get('[data-cy="tag-color-picker"]').click();
      cy.get(`[data-cy="color-option"][data-color="${newTag.color}"]`).click();
      cy.get('[data-cy="save-tag-btn"]').click();

      // Verify tag appears in list
      cy.get('[data-cy="tag-list"]')
        .should('contain.text', newTag.name);
      
      cy.get(`[data-cy="tag-item"]:contains("${newTag.name}")`)
        .find('[data-cy="tag-color"]')
        .should('have.css', 'background-color', 'rgb(59, 130, 246)');
    });

    it('should validate tag name requirements', () => {
      cy.get('[data-cy="create-tag-btn"]').click();
      
      // Try to save without name
      cy.get('[data-cy="save-tag-btn"]').click();
      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .should('contain.text', 'Tag name is required');

      // Try name that's too long
      cy.get('[data-cy="tag-name-input"]').type('A'.repeat(51));
      cy.get('[data-cy="save-tag-btn"]').click();
      cy.get('[data-cy="error-message"]')
        .should('contain.text', 'Tag name must be 50 characters or less');
    });

    it('should prevent duplicate tag names', () => {
      const existingTag = TagTestDataGenerator.generateTag({
        name: 'Existing Tag',
        userId: testUser.uid
      });

      cy.task('db:seedTags', { userId: testUser.uid, tags: [existingTag] });
      cy.reload();

      cy.get('[data-cy="create-tag-btn"]').click();
      cy.get('[data-cy="tag-name-input"]').type('Existing Tag');
      cy.get('[data-cy="save-tag-btn"]').click();

      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .should('contain.text', 'Tag name already exists');
    });

    it('should provide default colors for new tags', () => {
      cy.get('[data-cy="create-tag-btn"]').click();
      
      // Should show color palette
      cy.get('[data-cy="tag-color-picker"]').click();
      cy.get('[data-cy="color-palette"]').should('be.visible');
      
      // Should have predefined colors
      const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      defaultColors.forEach(color => {
        cy.get(`[data-cy="color-option"][data-color="${color}"]`).should('exist');
      });
    });

    it('should allow custom color selection', () => {
      cy.get('[data-cy="create-tag-btn"]').click();
      cy.get('[data-cy="tag-name-input"]').type('Custom Color Tag');
      
      // Select custom color
      cy.get('[data-cy="custom-color-input"]').invoke('val', '#FF5733').trigger('change');
      cy.get('[data-cy="save-tag-btn"]').click();

      cy.get(`[data-cy="tag-item"]:contains("Custom Color Tag")`)
        .find('[data-cy="tag-color"]')
        .should('have.css', 'background-color', 'rgb(255, 87, 51)');
    });
  });

  describe('Tag Editing', () => {
    let editableTag: any;

    beforeEach(() => {
      editableTag = TagTestDataGenerator.generateTag({
        name: 'Editable Tag',
        color: '#10B981',
        userId: testUser.uid
      });

      cy.task('db:seedTags', { userId: testUser.uid, tags: [editableTag] });
      cy.reload();
    });

    it('should edit tag name and color', () => {
      cy.get(`[data-cy="tag-item"]:contains("${editableTag.name}")`)
        .find('[data-cy="edit-tag-btn"]')
        .click();

      cy.get('[data-cy="tag-name-input"]')
        .clear()
        .type('Updated Tag Name');

      cy.get('[data-cy="tag-color-picker"]').click();
      cy.get('[data-cy="color-option"][data-color="#EF4444"]').click();

      cy.get('[data-cy="save-tag-btn"]').click();

      // Verify changes
      cy.get('[data-cy="tag-list"]')
        .should('contain.text', 'Updated Tag Name')
        .should('not.contain.text', editableTag.name);

      cy.get(`[data-cy="tag-item"]:contains("Updated Tag Name")`)
        .find('[data-cy="tag-color"]')
        .should('have.css', 'background-color', 'rgb(239, 68, 68)');
    });

    it('should cancel tag editing', () => {
      cy.get(`[data-cy="tag-item"]:contains("${editableTag.name}")`)
        .find('[data-cy="edit-tag-btn"]')
        .click();

      cy.get('[data-cy="tag-name-input"]')
        .clear()
        .type('This Should Not Save');

      cy.get('[data-cy="cancel-edit-btn"]').click();

      // Should revert to original
      cy.get('[data-cy="tag-list"]')
        .should('contain.text', editableTag.name)
        .should('not.contain.text', 'This Should Not Save');
    });
  });

  describe('Tag Deletion', () => {
    let deletableTag: any;
    let taggedTasks: any[];

    beforeEach(() => {
      deletableTag = TagTestDataGenerator.generateTag({
        name: 'Deletable Tag',
        userId: testUser.uid
      });

      taggedTasks = [
        TaskTestDataGenerator.generateTask({
          title: 'Tagged Task 1',
          tags: [deletableTag.name],
          userId: testUser.uid
        }),
        TaskTestDataGenerator.generateTask({
          title: 'Tagged Task 2',
          tags: [deletableTag.name, 'other-tag'],
          userId: testUser.uid
        })
      ];

      cy.task('db:seedTags', { userId: testUser.uid, tags: [deletableTag] });
      cy.task('db:seedTasks', { userId: testUser.uid, tasks: taggedTasks });
      cy.reload();
    });

    it('should delete tag with confirmation', () => {
      cy.get(`[data-cy="tag-item"]:contains("${deletableTag.name}")`)
        .find('[data-cy="delete-tag-btn"]')
        .click();

      // Should show warning about tagged tasks
      cy.get('[data-cy="delete-warning"]')
        .should('be.visible')
        .should('contain.text', '2 tasks are using this tag');

      cy.get('[data-cy="confirm-delete-btn"]').click();

      // Tag should be removed from list
      cy.get('[data-cy="tag-list"]')
        .should('not.contain.text', deletableTag.name);

      // Verify tasks still exist but tag is removed
      cy.visit('/tasks');
      cy.get('[data-cy="task-list"]')
        .should('contain.text', 'Tagged Task 1')
        .should('contain.text', 'Tagged Task 2');
    });

    it('should cancel tag deletion', () => {
      cy.get(`[data-cy="tag-item"]:contains("${deletableTag.name}")`)
        .find('[data-cy="delete-tag-btn"]')
        .click();

      cy.get('[data-cy="cancel-delete-btn"]').click();

      // Tag should still be in list
      cy.get('[data-cy="tag-list"]')
        .should('contain.text', deletableTag.name);
    });
  });

  describe('Tag Filtering and Search', () => {
    beforeEach(() => {
      const testTags = [
        TagTestDataGenerator.generateTag({ name: 'Work', color: '#3B82F6', userId: testUser.uid }),
        TagTestDataGenerator.generateTag({ name: 'Personal', color: '#10B981', userId: testUser.uid }),
        TagTestDataGenerator.generateTag({ name: 'Urgent', color: '#EF4444', userId: testUser.uid }),
        TagTestDataGenerator.generateTag({ name: 'Learning', color: '#8B5CF6', userId: testUser.uid }),
        TagTestDataGenerator.generateTag({ name: 'Meeting', color: '#F59E0B', userId: testUser.uid })
      ];

      cy.task('db:seedTags', { userId: testUser.uid, tags: testTags });
      cy.reload();
    });

    it('should search tags by name', () => {
      cy.get('[data-cy="tag-search-input"]').type('Work');
      cy.get('[data-cy="tag-item"]').should('have.length', 1);
      cy.get('[data-cy="tag-list"]').should('contain.text', 'Work');
    });

    it('should filter tags by color', () => {
      cy.get('[data-cy="color-filter"]').click();
      cy.get('[data-cy="color-filter-option"][data-color="#3B82F6"]').click();

      cy.get('[data-cy="tag-item"]').should('have.length', 1);
      cy.get('[data-cy="tag-list"]').should('contain.text', 'Work');
    });

    it('should clear search and filters', () => {
      cy.get('[data-cy="tag-search-input"]').type('Work');
      cy.get('[data-cy="clear-search-btn"]').click();

      cy.get('[data-cy="tag-item"]').should('have.length', 5);
    });
  });

  describe('Task Tagging', () => {
    let availableTags: any[];
    let testTask: any;

    beforeEach(() => {
      availableTags = [
        TagTestDataGenerator.generateTag({ name: 'Work', color: '#3B82F6', userId: testUser.uid }),
        TagTestDataGenerator.generateTag({ name: 'Personal', color: '#10B981', userId: testUser.uid }),
        TagTestDataGenerator.generateTag({ name: 'Urgent', color: '#EF4444', userId: testUser.uid })
      ];

      testTask = TaskTestDataGenerator.generateTask({
        title: 'Taggable Task',
        userId: testUser.uid
      });

      cy.task('db:seedTags', { userId: testUser.uid, tags: availableTags });
      cy.task('db:seedTasks', { userId: testUser.uid, tasks: [testTask] });
      
      cy.visit('/tasks');
    });

    it('should add tags to a task', () => {
      cy.get(`[data-cy="task-item"]:contains("${testTask.title}")`)
        .find('[data-cy="add-tags-btn"]')
        .click();

      // Select multiple tags
      cy.get('[data-cy="tag-selector"]').should('be.visible');
      cy.get('[data-cy="tag-option"]:contains("Work")').click();
      cy.get('[data-cy="tag-option"]:contains("Urgent")').click();

      cy.get('[data-cy="apply-tags-btn"]').click();

      // Verify tags appear on task
      cy.get(`[data-cy="task-item"]:contains("${testTask.title}")`)
        .find('[data-cy="task-tag"]')
        .should('have.length', 2)
        .should('contain.text', 'Work')
        .should('contain.text', 'Urgent');
    });

    it('should remove tags from a task', () => {
      // First add some tags
      const taggedTask = { ...testTask, tags: ['Work', 'Personal'] };
      cy.task('db:updateTask', { taskId: testTask.id, updates: taggedTask });
      cy.reload();

      cy.get(`[data-cy="task-item"]:contains("${testTask.title}")`)
        .find('[data-cy="task-tag"]:contains("Work")')
        .find('[data-cy="remove-tag-btn"]')
        .click();

      // Should only have Personal tag remaining
      cy.get(`[data-cy="task-item"]:contains("${testTask.title}")`)
        .find('[data-cy="task-tag"]')
        .should('have.length', 1)
        .should('contain.text', 'Personal')
        .should('not.contain.text', 'Work');
    });

    it('should create new tag while tagging task', () => {
      cy.get(`[data-cy="task-item"]:contains("${testTask.title}")`)
        .find('[data-cy="add-tags-btn"]')
        .click();

      // Type new tag name
      cy.get('[data-cy="new-tag-input"]').type('New Tag{enter}');

      // Should create and apply new tag
      cy.get('[data-cy="tag-option"]:contains("New Tag")').should('exist');
      cy.get('[data-cy="apply-tags-btn"]').click();

      // Verify new tag appears on task
      cy.get(`[data-cy="task-item"]:contains("${testTask.title}")`)
        .find('[data-cy="task-tag"]')
        .should('contain.text', 'New Tag');
    });
  });

  describe('Tag Statistics', () => {
    beforeEach(() => {
      const tagsWithTasks = [
        { tag: TagTestDataGenerator.generateTag({ name: 'Work', userId: testUser.uid }), taskCount: 5 },
        { tag: TagTestDataGenerator.generateTag({ name: 'Personal', userId: testUser.uid }), taskCount: 3 },
        { tag: TagTestDataGenerator.generateTag({ name: 'Urgent', userId: testUser.uid }), taskCount: 8 },
        { tag: TagTestDataGenerator.generateTag({ name: 'Unused', userId: testUser.uid }), taskCount: 0 }
      ];

      const tags = tagsWithTasks.map(t => t.tag);
      const tasks = tagsWithTasks.flatMap(({ tag, taskCount }) =>
        Array.from({ length: taskCount }, (_, i) =>
          TaskTestDataGenerator.generateTask({
            title: `${tag.name} Task ${i + 1}`,
            tags: [tag.name],
            userId: testUser.uid
          })
        )
      );

      cy.task('db:seedTags', { userId: testUser.uid, tags });
      cy.task('db:seedTasks', { userId: testUser.uid, tasks });
      cy.reload();
    });

    it('should display tag usage statistics', () => {
      cy.get('[data-cy="tag-stats-toggle"]').click();

      cy.get('[data-cy="tag-stat"]:contains("Work")')
        .find('[data-cy="task-count"]')
        .should('contain.text', '5 tasks');

      cy.get('[data-cy="tag-stat"]:contains("Urgent")')
        .find('[data-cy="task-count"]')
        .should('contain.text', '8 tasks');

      cy.get('[data-cy="tag-stat"]:contains("Unused")')
        .find('[data-cy="task-count"]')
        .should('contain.text', '0 tasks');
    });

    it('should sort tags by usage', () => {
      cy.get('[data-cy="tag-stats-toggle"]').click();
      cy.get('[data-cy="sort-by-usage-btn"]').click();

      // Should be ordered by task count (descending)
      cy.get('[data-cy="tag-stat"]').first().should('contain.text', 'Urgent');
      cy.get('[data-cy="tag-stat"]').eq(1).should('contain.text', 'Work');
      cy.get('[data-cy="tag-stat"]').eq(2).should('contain.text', 'Personal');
      cy.get('[data-cy="tag-stat"]').last().should('contain.text', 'Unused');
    });

    it('should identify and highlight unused tags', () => {
      cy.get('[data-cy="unused-tags-filter"]').click();

      cy.get('[data-cy="tag-item"]').should('have.length', 1);
      cy.get('[data-cy="tag-list"]').should('contain.text', 'Unused');

      cy.get('[data-cy="tag-item"]:contains("Unused")')
        .should('have.class', 'unused-tag');
    });
  });

  describe('Tag Import/Export', () => {
    beforeEach(() => {
      const exportTags = [
        TagTestDataGenerator.generateTag({ name: 'Export Tag 1', color: '#3B82F6', userId: testUser.uid }),
        TagTestDataGenerator.generateTag({ name: 'Export Tag 2', color: '#10B981', userId: testUser.uid })
      ];

      cy.task('db:seedTags', { userId: testUser.uid, tags: exportTags });
      cy.reload();
    });

    it('should export tags to JSON', () => {
      cy.get('[data-cy="export-tags-btn"]').click();

      // Should trigger download
      cy.readFile('cypress/downloads/tags-export.json').should('exist');
      cy.readFile('cypress/downloads/tags-export.json').then(exportData => {
        expect(exportData).to.have.property('tags');
        expect(exportData.tags).to.have.length(2);
        expect(exportData.tags[0]).to.have.property('name');
        expect(exportData.tags[0]).to.have.property('color');
      });
    });

    it('should import tags from JSON', () => {
      const importData = {
        tags: [
          { name: 'Imported Tag 1', color: '#F59E0B' },
          { name: 'Imported Tag 2', color: '#8B5CF6' }
        ]
      };

      cy.writeFile('cypress/fixtures/import-tags.json', importData);

      cy.get('[data-cy="import-tags-btn"]').click();
      cy.get('[data-cy="import-file-input"]').selectFile('cypress/fixtures/import-tags.json');
      cy.get('[data-cy="confirm-import-btn"]').click();

      // Should show imported tags
      cy.get('[data-cy="tag-list"]')
        .should('contain.text', 'Imported Tag 1')
        .should('contain.text', 'Imported Tag 2');
    });

    it('should handle import errors gracefully', () => {
      const invalidImportData = { invalid: 'structure' };
      cy.writeFile('cypress/fixtures/invalid-tags.json', invalidImportData);

      cy.get('[data-cy="import-tags-btn"]').click();
      cy.get('[data-cy="import-file-input"]').selectFile('cypress/fixtures/invalid-tags.json');
      cy.get('[data-cy="confirm-import-btn"]').click();

      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .should('contain.text', 'Invalid import file format');
    });
  });

  describe('Tag Accessibility', () => {
    beforeEach(() => {
      const accessibilityTags = [
        TagTestDataGenerator.generateTag({ name: 'High Contrast', color: '#000000', userId: testUser.uid }),
        TagTestDataGenerator.generateTag({ name: 'Low Contrast', color: '#F0F0F0', userId: testUser.uid })
      ];

      cy.task('db:seedTags', { userId: testUser.uid, tags: accessibilityTags });
      cy.reload();
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-cy="tag-list"]')
        .should('have.attr', 'role', 'list');

      cy.get('[data-cy="tag-item"]')
        .first()
        .should('have.attr', 'role', 'listitem');

      cy.get('[data-cy="create-tag-btn"]')
        .should('have.attr', 'aria-label', 'Create new tag');
    });

    it('should be keyboard navigable', () => {
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'create-tag-btn');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy', 'tag-search-input');
    });

    it('should provide color contrast warnings', () => {
      // Should warn about low contrast colors
      cy.get('[data-cy="tag-item"]:contains("Low Contrast")')
        .find('[data-cy="contrast-warning"]')
        .should('be.visible')
        .should('have.attr', 'title', 'Low color contrast - may be hard to read');
    });
  });

  describe('Tag Performance', () => {
    it('should handle large numbers of tags efficiently', () => {
      // Create 500 test tags
      const largeTags = Array.from({ length: 500 }, (_, i) =>
        TagTestDataGenerator.generateTag({
          name: `Performance Tag ${i + 1}`,
          color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i % 5],
          userId: testUser.uid
        })
      );

      cy.task('db:seedTags', { userId: testUser.uid, tags: largeTags });
      cy.reload();

      // Should load within reasonable time
      cy.get('[data-cy="tag-list"]', { timeout: 5000 }).should('be.visible');
      
      // Search should be responsive
      cy.get('[data-cy="tag-search-input"]').type('Performance Tag 1');
      cy.get('[data-cy="tag-item"]').should('have.length.at.most', 20);
    });
  });
});