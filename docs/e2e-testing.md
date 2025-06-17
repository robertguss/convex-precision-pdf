# E2E Testing with Playwright

This project uses [Playwright](https://playwright.dev/) for end-to-end testing. Our test suite includes comprehensive coverage of authentication flows, payment processing, document management, and subscription lifecycle.

## Quick Start

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install

# Run all tests
pnpm run pw:test

# Run tests in UI mode (recommended for development)
pnpm run pw:test:ui

# Run specific test file
pnpm run pw:test tests/e2e/subscriptions/upgrade-flow.spec.ts

# Run tests in debug mode
pnpm run pw:test:debug
```

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── subscriptions/      # Payment and subscription tests
│   │   ├── upgrade-flow.spec.ts
│   │   ├── downgrade-flow.spec.ts
│   │   ├── payment-failures.spec.ts
│   │   └── subscription-lifecycle.spec.ts
│   ├── advanced-features-demo.spec.ts
│   └── setup-verification.spec.ts
├── fixtures/               # Test data files
├── helpers/                # Test utilities
│   ├── auth.helper.ts      # Authentication helpers
│   ├── payment.helper.ts   # Payment/Stripe helpers
│   ├── document.helper.ts  # Document management helpers
│   ├── database.helper.ts  # Test data setup helpers
│   ├── network.helper.ts   # Network interception helpers
│   ├── visual.helper.ts    # Visual testing helpers
│   ├── performance.helper.ts # Performance testing helpers
│   └── trace.helper.ts     # Debugging and trace helpers
└── reporters/              # Custom test reporters
```

## Key Features

### 1. Authentication with Clerk

We use Clerk's official testing package for authentication:

```typescript
import { setupClerkTestingToken } from '@clerk/testing/playwright';

// In your test
await setupClerkTestingToken({ page });
await auth.loginAsUser(page, 'free'); // or 'pro', 'business'
```

### 2. Payment Testing

Comprehensive Stripe integration testing:

```typescript
// Test upgrade flow
await payment.navigateToUpgrade(page, 'pro');
await payment.fillStripeCheckout(page, testCards.valid.number);
await payment.completeStripePayment(page);
await payment.waitForStripeRedirect(page);

// Test payment failures
await payment.simulatePaymentFailure(page);
```

### 3. Visual Testing

Catch UI regressions automatically:

```typescript
// Take visual snapshot
await visual.takeVisualSnapshot(page, 'pricing-page');

// Test responsive design
await visual.testResponsiveDesign(page, 'home', [
  { width: 1920, height: 1080, label: 'desktop' },
  { width: 768, height: 1024, label: 'tablet' },
  { width: 375, height: 667, label: 'mobile' }
]);

// Test dark mode
await visual.testDarkMode(page, 'dashboard');
```

### 4. Performance Testing

Monitor and enforce performance budgets:

```typescript
// Measure performance
const metrics = await performance.measurePagePerformance(page);

// Check against budget
const budget = {
  pageLoad: 3000,
  firstContentfulPaint: 1500,
  largestContentfulPaint: 2500
};
const results = performance.checkPerformanceBudget(metrics, budget);
```

### 5. Network Mocking

Test edge cases and error scenarios:

```typescript
// Mock API responses
await network.mockConvexQuery(page, 'getUser', {
  email: 'test@example.com',
  credits: 100,
  plan: 'pro'
});

// Simulate network failures
await network.simulateNetworkFailure(page, '**/api/documents/**');

// Simulate slow network
await network.simulateSlowNetwork(page, 3000);
```

### 6. Enhanced Debugging

Rich debugging information when tests fail:

```typescript
// Add custom trace events
await trace.addTraceEvent(page, 'User Action', 'Starting checkout');

// Measure operations
await trace.measureInTrace(page, 'payment-flow', async () => {
  // Your test actions
});

// Debug breakpoint
await trace.debugBreakpoint(page, 'About to submit payment');
```

## Environment Variables

Required environment variables for testing:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_TESTING_TOKEN=... # Get from Clerk dashboard

# Convex
NEXT_PUBLIC_CONVEX_URL=https://...

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
```

## Test Data

We use predefined test users with different subscription tiers:

- **Free User**: `free.user@test.precisionpdf.com` (3 credits)
- **Pro User**: `pro.user@test.precisionpdf.com` (50 credits)
- **Business User**: `business.user@test.precisionpdf.com` (500 credits)

## Running Tests in CI

Tests run automatically on push and pull requests via GitHub Actions:

- Tests are sharded across 4 workers for faster execution
- Visual tests run separately to ensure consistency
- Performance tests run against production build
- Test artifacts are stored for 30 days

## Writing New Tests

Use our test fixtures for consistent setup:

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test('my new test', async ({ page, auth, payment, document, database }) => {
  // Reset test data
  await database.resetDatabase();
  await database.seedTestUsers();
  
  // Login
  await auth.loginAsUser(page, 'pro');
  
  // Your test logic here
  await expect(page.locator('[data-cy="element"]')).toBeVisible();
});
```

## Best Practices

1. **Use data-cy attributes** for test selectors:
   ```html
   <button data-cy="upgrade-button">Upgrade</button>
   ```

2. **Reset state before each test**:
   ```typescript
   test.beforeEach(async ({ database }) => {
     await database.resetDatabase();
     await database.seedTestUsers();
   });
   ```

3. **Use helpers instead of raw Playwright commands**:
   ```typescript
   // Good
   await payment.verifySubscription(page, 'Pro', 50);
   
   // Avoid
   await expect(page.locator('[data-cy="current-plan"]')).toContainText('Pro');
   await expect(page.locator('[data-cy="page-credits"]')).toContainText('50');
   ```

4. **Add meaningful test descriptions**:
   ```typescript
   test.describe('Subscription Upgrade Flow', () => {
     test('should successfully upgrade from free to pro plan', async () => {
       // Test implementation
     });
   });
   ```

## Debugging Failed Tests

1. **Run in UI mode**: `pnpm run pw:test:ui`
2. **Check traces**: Failed tests generate traces in `test-results/traces/`
3. **View HTML report**: `pnpm run pw:report`
4. **Check screenshots**: Available in `test-results/` for failed tests
5. **Use debug mode**: `pnpm run pw:test:debug`

## Advanced Usage

### Visual Regression Testing

```bash
# Update baseline screenshots
pnpm run pw:test --update-snapshots

# Run only visual tests
pnpm run pw:test --grep @visual
```

### Performance Testing

```bash
# Run only performance tests
pnpm run pw:test --grep @performance
```

### Flakiness Detection

```typescript
// Detect flaky tests
const flakiness = await trace.detectFlakiness(async () => {
  // Your test code
}, 5); // Run 5 times

expect(flakiness.flaky).toBe(false);
```

## Troubleshooting

### Tests timing out
- Increase timeout in test: `test.setTimeout(60000);`
- Check if app is running: `pnpm run dev`
- Verify environment variables are set

### Authentication issues
- Ensure `CLERK_TESTING_TOKEN` is set
- Check Clerk dashboard for test mode
- Verify test users exist

### Visual test failures
- Update snapshots if changes are intentional
- Check for dynamic content that needs masking
- Ensure consistent viewport sizes

### Network mocking not working
- Verify route patterns match actual URLs
- Check network tab in trace viewer
- Ensure mocks are set before navigation

## Migration from Cypress

This test suite was migrated from Cypress. Key differences:

- **Async/await syntax** instead of command chaining
- **Fixtures** for dependency injection
- **Better debugging** with traces and timeline
- **Native network control** without plugins
- **Built-in visual testing** without additional tools
- **Faster execution** with true parallelization

For more information, see the [Playwright documentation](https://playwright.dev/).