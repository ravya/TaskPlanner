import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: true,
    screenshot: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    env: {
      // Firebase Emulator Configuration
      FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
      FIRESTORE_EMULATOR_HOST: 'localhost:8080',
      FIREBASE_PROJECT_ID: 'demo-taskflow',
      
      // Test User Credentials
      TEST_USER_EMAIL: 'test@taskflow.dev',
      TEST_USER_PASSWORD: 'TestPass123!',
      TEST_ADMIN_EMAIL: 'admin@taskflow.dev',
      TEST_ADMIN_PASSWORD: 'AdminPass123!',
    },
    
    setupNodeEvents(on, config) {
      // Add custom tasks here if needed
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        
        // Clear Firebase emulator data
        clearFirebaseData() {
          return new Promise((resolve) => {
            // This would clear emulator data between tests
            setTimeout(() => resolve(null), 100);
          });
        },

        // Database seeding tasks for E2E tests
        'db:seed'() {
          // Initialize clean test database state
          console.log('Seeding test database...');
          return null;
        },

        'db:createUser'(userData) {
          // Create test user in Firebase Auth emulator
          console.log('Creating test user:', userData.email);
          return null;
        },

        'db:seedTasks'({ userId, tasks }) {
          // Seed tasks for specific user
          console.log(`Seeding ${tasks.length} tasks for user:`, userId);
          return null;
        },

        'db:seedTags'({ userId, tags }) {
          // Seed tags for specific user
          console.log(`Seeding ${tags.length} tags for user:`, userId);
          return null;
        },

        'db:updateTask'({ taskId, updates }) {
          // Update specific task
          console.log('Updating task:', taskId);
          return null;
        },

        'auth:invalidateUserSessions'(userId) {
          // Invalidate user sessions (for testing concurrent login scenarios)
          console.log('Invalidating sessions for user:', userId);
          return null;
        }
      });

      return config;
    },
  },

  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    supportFile: 'cypress/support/component.ts',
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },

  // Browser configuration
  browsers: [
    {
      name: 'chrome',
      family: 'chromium',
      channel: 'stable',
      displayName: 'Chrome',
    },
    {
      name: 'firefox',
      family: 'firefox',
      channel: 'stable',
      displayName: 'Firefox',
    },
  ],

  // Global configuration
  watchForFileChanges: true,
  chromeWebSecurity: false,
  modifyObstructiveCode: false,
  blockHosts: null,
  
  // Retry configuration
  retries: {
    runMode: 2,
    openMode: 0,
  },
});