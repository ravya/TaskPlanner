# Web Interface Test Suite

This directory contains the test setup and utilities for the TaskFlow web application.

## Test Structure

```
web/src/
├── test/
│   ├── setup.ts          # Test environment setup
│   ├── testUtils.tsx     # Custom render functions with providers
│   ├── mockData.ts       # Mock data for tests
│   └── README.md         # This file
├── components/
│   └── ui/
│       ├── Button/
│       │   └── Button.test.tsx
│       └── Input/
│           └── Input.test.tsx
├── hooks/
│   └── useAuth.test.ts
├── features/
│   └── tasks/
│       └── TaskList.test.tsx
└── utils/
    └── validation.test.ts
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm test -- --coverage
```

### E2E Tests (Cypress)

```bash
# Open Cypress Test Runner
npm run test:e2e

# Run E2E tests headlessly
npm run test:e2e:headless

# Run E2E tests in Chrome
npm run test:e2e:chrome

# Run E2E tests in Firefox
npm run test:e2e:firefox
```

### Run All Tests

```bash
npm run test:all
```

## Test Coverage

### Current Coverage

- **UI Components**: Button, Input, Textarea, PasswordInput, InputGroup
- **Hooks**: useAuth
- **Utils**: Validation schemas
- **Features**: TaskList
- **Common Components**: SearchInput

### Areas Tested

1. **Component Rendering**
   - Basic rendering
   - Props validation
   - Conditional rendering

2. **User Interactions**
   - Click events
   - Form submissions
   - Keyboard navigation

3. **State Management**
   - Loading states
   - Error states
   - Data updates

4. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

5. **Form Validation**
   - Email validation
   - Password strength
   - Required fields
   - Custom validation rules

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('should return correct initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(0);
  });
});
```

### E2E Tests (Cypress)

```typescript
describe('Feature', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.login('test@example.com', 'password');
  });

  it('should complete user flow', () => {
    cy.get('[data-cy="button"]').click();
    cy.get('[data-cy="result"]').should('be.visible');
  });
});
```

## Mock Data

Use the provided mock data from `mockData.ts`:

```typescript
import { mockUser, mockTask, mockTasks } from '@/test/mockData';

// Use in tests
render(<TaskList tasks={mockTasks} />);
```

## Test Utilities

### Custom Render

The `render` function from `testUtils.tsx` automatically wraps components with required providers:

```typescript
import { render } from '@/test/testUtils';

render(<MyComponent />); // Automatically includes Router and React Query providers
```

### Available Utilities

- `render()` - Custom render with providers
- `screen` - Query elements
- `fireEvent` - Trigger events
- `waitFor()` - Wait for async operations
- `vi.fn()` - Create mock functions
- `vi.mock()` - Mock modules

## Best Practices

1. **Use Testing Library Queries**
   - Prefer `getByRole` over `getByTestId`
   - Use `getByLabelText` for form inputs
   - Use `getByText` for text content

2. **Mock External Dependencies**
   - Firebase services are mocked in `setup.ts`
   - Mock API calls in individual tests
   - Use `vi.mock()` for module mocking

3. **Test User Behavior**
   - Test what users see and do
   - Avoid testing implementation details
   - Focus on user experience

4. **Accessibility Testing**
   - Test keyboard navigation
   - Verify ARIA attributes
   - Check semantic HTML

5. **Async Testing**
   - Use `waitFor()` for async operations
   - Use `findBy` queries for elements that appear async
   - Handle loading and error states

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Before deployments

## Coverage Goals

- **Target**: 80% code coverage
- **Components**: 90% coverage
- **Utils**: 95% coverage
- **Hooks**: 85% coverage

## Troubleshooting

### Common Issues

1. **Tests timeout**
   - Increase timeout in test or vitest.config.ts
   - Check for unresolved promises

2. **Mock not working**
   - Ensure mock is defined before import
   - Check mock path matches actual path

3. **Element not found**
   - Use `screen.debug()` to see rendered output
   - Check if element is rendered conditionally
   - Use `findBy` for async elements

4. **Firebase errors**
   - Mocks are in setup.ts
   - Add new Firebase methods to mocks as needed

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
