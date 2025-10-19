# E2E Tests with Playwright

This directory contains end-to-end tests for the application using Playwright.

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/chat.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Structure

- `chat.spec.ts` - Chat interface functionality
- `agents.spec.ts` - Agent selection and management
- `performance.spec.ts` - Performance metrics and budgets
- `accessibility.spec.ts` - WCAG compliance and keyboard navigation

## Writing Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/route');
  });

  test('should do something', async ({ page }) => {
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

## Best Practices

1. Use semantic selectors (role, label, text)
2. Wait for elements to be visible before interacting
3. Use `test.describe` to group related tests
4. Clean up state in `beforeEach` or `afterEach`
5. Use meaningful test descriptions

## CI/CD Integration

Tests are configured to run in CI with:
- Automatic retries on failure
- Screenshot capture on failure
- Trace recording for debugging
- HTML report generation

## Debugging

```bash
# Debug mode
npx playwright test --debug

# Show trace viewer
npx playwright show-trace trace.zip

# Generate HTML report
npx playwright show-report
```
