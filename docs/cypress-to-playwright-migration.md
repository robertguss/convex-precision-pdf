# Cypress to Playwright Migration Guide

This document outlines the migration from Cypress to Playwright for our E2E testing suite.

## Why Playwright?

We migrated to Playwright for several key advantages:

1. **Better Performance**: True parallel test execution across multiple browsers
2. **Superior Debugging**: Built-in trace viewer, videos, and screenshots
3. **Native Features**: Network interception, multiple contexts, and mobile testing
4. **Modern API**: Async/await syntax without command chaining
5. **Visual Testing**: Built-in screenshot comparison
6. **Better TypeScript Support**: First-class TypeScript integration

## Migration Overview

### Test Structure Comparison

**Cypress Structure:**
```
cypress/
├── e2e/
├── fixtures/
├── plugins/
├── support/
└── screenshots/
```

**Playwright Structure:**
```
tests/
├── e2e/
├── fixtures/
├── helpers/
├── reporters/
└── global-setup.ts
```

### Syntax Changes

#### Basic Navigation and Assertions

**Cypress:**
```javascript
cy.visit('/');
cy.get('[data-cy=title]').should('contain', 'Welcome');
```

**Playwright:**
```typescript
await page.goto('/');
await expect(page.locator('[data-cy="title"]')).toContainText('Welcome');
```

#### Authentication

**Cypress:**
```javascript
cy.loginAsUser('free');
cy.get('[data-cy=dashboard]').should('be.visible');
```

**Playwright:**
```typescript
await auth.loginAsUser(page, 'free');
await expect(page.locator('[data-cy="dashboard"]')).toBeVisible();
```

#### Waiting for Elements

**Cypress:**
```javascript
cy.get('[data-cy=loader]').should('not.exist');
cy.get('[data-cy=content]').should('be.visible');
```

**Playwright:**
```typescript
await expect(page.locator('[data-cy="loader"]')).not.toBeVisible();
await expect(page.locator('[data-cy="content"]')).toBeVisible();
```

#### Network Interception

**Cypress:**
```javascript
cy.intercept('POST', '/api/stripe/webhook', { success: true }).as('webhook');
cy.wait('@webhook');
```

**Playwright:**
```typescript
await network.mockStripeWebhook(page, { success: true });
await network.waitForAPICall(page, '/api/stripe/webhook');
```

### Custom Commands → Helper Functions

| Cypress Command | Playwright Helper |
|----------------|-------------------|
| `cy.loginAsUser()` | `auth.loginAsUser()` |
| `cy.fillStripeCheckout()` | `payment.fillStripeCheckout()` |
| `cy.uploadFile()` | `document.uploadFile()` |
| `cy.waitForProcessing()` | `document.waitForProcessing()` |
| `cy.task('resetDatabase')` | `database.resetDatabase()` |

### Key Differences

#### 1. Async/Await Pattern

Cypress uses command chaining, while Playwright uses async/await:

**Cypress:**
```javascript
cy.get('button')
  .click()
  .then(() => {
    cy.get('.result').should('be.visible');
  });
```

**Playwright:**
```typescript
await page.locator('button').click();
await expect(page.locator('.result')).toBeVisible();
```

#### 2. Multiple Contexts

Playwright supports multiple browser contexts and pages:

```typescript
// Open new tab
const newPage = await context.newPage();
await newPage.goto('/other-page');

// Test in multiple tabs simultaneously
await expect(page.locator('.original')).toBeVisible();
await expect(newPage.locator('.new-tab')).toBeVisible();
```

#### 3. Built-in Waiting

Playwright automatically waits for elements, no need for explicit waits:

```typescript
// Playwright waits for button to be clickable
await page.locator('button').click();

// Automatically retries until condition is met
await expect(page.locator('.result')).toBeVisible();
```

#### 4. Better Selectors

Playwright offers more flexible selectors:

```typescript
// Text selector
await page.locator('text=Submit').click();

// Role selector
await page.locator('role=button[name="Submit"]').click();

// Chained selectors
await page.locator('.form').locator('button').click();
```

## New Features in Playwright

### 1. Visual Testing

```typescript
// Take screenshot for comparison
await visual.takeVisualSnapshot(page, 'dashboard');

// Test responsive design
await visual.testResponsiveDesign(page, 'home', viewports);
```

### 2. Performance Testing

```typescript
// Measure Core Web Vitals
const metrics = await performance.measurePagePerformance(page);

// Detect memory leaks
const leakTest = await performance.detectMemoryLeaks(page, action);
```

### 3. Enhanced Debugging

```typescript
// Add custom trace events
await trace.addTraceEvent(page, 'Payment', 'Starting checkout');

// Capture detailed timeline
const timeline = new trace.TestTimeline();
timeline.addEvent('navigation', 'Loading dashboard');
```

### 4. Network Control

```typescript
// Simulate slow network
await network.simulateSlowNetwork(page, 3000);

// Mock API responses
await network.mockConvexQuery(page, 'getUser', mockData);
```

## Running Tests

### Local Development

```bash
# Run all tests
pnpm run pw:test

# Run in UI mode (recommended)
pnpm run pw:test:ui

# Run specific test
pnpm run pw:test tests/e2e/subscriptions/upgrade-flow.spec.ts

# Update visual snapshots
pnpm run pw:test --update-snapshots
```

### CI/CD

Tests run automatically in GitHub Actions with:
- Parallel execution across 4 shards
- Separate visual and performance test jobs
- Automatic artifact storage
- Custom HTML reports

## Best Practices

1. **Use Test Fixtures**: Leverage Playwright's fixture system for setup
2. **Isolate Tests**: Each test should be independent
3. **Use Helpers**: Don't write raw Playwright commands
4. **Visual Testing**: Add visual snapshots for critical UI
5. **Performance Budgets**: Set and enforce performance limits

## Common Pitfalls

1. **Forgetting await**: All Playwright operations are async
2. **Wrong selector format**: Use `data-cy="name"` not `data-cy=name`
3. **Not waiting for navigation**: Use `waitForURL()` after navigation
4. **Assuming synchronous behavior**: Everything is asynchronous

## Debugging Tips

1. Use UI mode for development: `pnpm run pw:test:ui`
2. Enable trace on first retry in config
3. Use `page.pause()` for debugging
4. Check traces for failed tests
5. Use custom reporter for detailed logs

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Migrating from Cypress](https://playwright.dev/docs/migrating-from-cypress)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)