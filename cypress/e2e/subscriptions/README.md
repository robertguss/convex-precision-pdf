# Payment Flow E2E Tests

This directory contains comprehensive end-to-end tests for all payment and subscription flows in PrecisionPDF.

## Test Coverage

### 1. Upgrade Flows (`upgrade-flow.cy.ts`)
- Free → Pro upgrade with Stripe Checkout
- Pro → Business upgrade with proration
- Credit balance updates after upgrade
- Persistence through page refreshes and sign-outs
- Browser back button handling
- Network error recovery
- Duplicate upgrade prevention

### 2. Downgrade Flows (`downgrade-flow.cy.ts`)
- Business → Pro downgrade via Stripe Customer Portal
- Pro → Free downgrade (cancellation)
- Credit adjustment on downgrade
- Scheduled vs immediate downgrades
- Retention offers
- Reactivation after cancellation
- Data access maintenance

### 3. Payment Failures (`payment-failures.cy.ts`)
- Declined cards
- Insufficient funds
- Expired cards
- 3D Secure authentication (success and failure)
- Network timeouts
- Invalid payment details
- Retry logic and form preservation

### 4. Subscription Lifecycle (`subscription-lifecycle.cy.ts`)
- Automatic renewal processing
- Payment failure during renewal
- Grace period management
- Credit reset on renewal
- Mid-cycle plan changes
- Subscription pause/resume
- Billing notifications
- Cancellation and reversal

## Required Data Attributes

The tests rely on the following `data-cy` attributes in the application:

### Dashboard/General
- `data-cy="current-plan"` - Current subscription plan display
- `data-cy="page-credits"` - Credit balance display
- `data-cy="credits-used"` - Credits used vs total
- `data-cy="credit-warning"` - Low credit warning
- `data-cy="upgrade-button"` - Upgrade CTA button

### Pricing Page
- `data-cy="pro-plan-card"` - Pro plan pricing card
- `data-cy="business-plan-card"` - Business plan pricing card
- `data-cy="plan-name"` - Plan name within card
- `data-cy="plan-price"` - Plan price display
- `data-cy="plan-credits"` - Credits included
- `data-cy="select-{plan}-plan"` - Plan selection button
- `data-cy="current-plan-badge"` - Current plan indicator
- `data-cy="proration-notice"` - Proration information

### Account Page
- `data-cy="subscription-status"` - Subscription status
- `data-cy="subscription-plan"` - Current plan name
- `data-cy="next-billing-date"` - Next renewal date
- `data-cy="manage-subscription"` - Manage subscription button
- `data-cy="payment-history"` - Payment history link
- `data-cy="credit-history"` - Credit history link
- `data-cy="update-payment-method"` - Update payment method button
- `data-cy="payment-method-warning"` - Expired card warning

### Payment/Billing
- `data-cy="payment-failed-banner"` - Payment failure notice
- `data-cy="retry-payment"` - Retry payment button
- `data-cy="payment-processing"` - Processing indicator
- `data-cy="payment-success-banner"` - Success message
- `data-cy="out-of-credits-modal"` - Out of credits modal
- `data-cy="error-message"` - General error display

### Subscription Management
- `data-cy="renewal-notice"` - Upcoming renewal notice
- `data-cy="grace-period-warning"` - Grace period warning
- `data-cy="grace-period-remaining"` - Days remaining in grace
- `data-cy="account-suspended-banner"` - Suspension notice
- `data-cy="reactivate-subscription"` - Reactivation button
- `data-cy="subscription-ending-notice"` - Cancellation pending
- `data-cy="cancellation-date"` - Cancellation effective date

## Running Tests

### All Payment Tests
```bash
pnpm cy:run --spec "cypress/e2e/subscriptions/**/*.cy.ts"
```

### Individual Test Files
```bash
# Upgrade flows only
pnpm cy:run --spec "cypress/e2e/subscriptions/upgrade-flow.cy.ts"

# Downgrade flows only
pnpm cy:run --spec "cypress/e2e/subscriptions/downgrade-flow.cy.ts"

# Payment failures only
pnpm cy:run --spec "cypress/e2e/subscriptions/payment-failures.cy.ts"

# Lifecycle tests only
pnpm cy:run --spec "cypress/e2e/subscriptions/subscription-lifecycle.cy.ts"
```

### Interactive Mode
```bash
pnpm cy:open
# Then navigate to subscriptions folder
```

## Test Data Setup

Tests use the following test users:
- `free.user@test.precisionpdf.com` - Free tier user
- `pro.user@test.precisionpdf.com` - Pro tier user
- `business.user@test.precisionpdf.com` - Business tier user

All test users use password: `TestPassword123!`

## Environment Requirements

1. **Stripe Test Mode**: Tests require Stripe to be in test mode with test API keys
2. **Convex Dev Server**: Local Convex instance for test data isolation
3. **Test Webhook Endpoint**: `/api/webhooks/stripe` must accept test webhooks

## CI/CD Integration

See `.github/workflows/e2e-tests.yml` for CI configuration.

Key considerations:
- Tests run against a test database
- Stripe webhooks use test signing secret
- Email notifications are captured, not sent
- All test data is cleaned up after runs

## Debugging Failed Tests

1. **Videos**: Check `cypress/videos/` for recordings of failed tests
2. **Screenshots**: Check `cypress/screenshots/` for failure screenshots
3. **Console Logs**: Tests log key actions for debugging
4. **Network Tab**: Use `cy.intercept` logs to debug API issues

## Adding New Tests

When adding new payment flow tests:

1. Add appropriate `data-cy` attributes to UI elements
2. Create test user scenarios in `test-data.ts`
3. Add necessary Cypress tasks in `plugins/index.ts`
4. Follow existing patterns for Stripe origin commands
5. Ensure proper cleanup in `afterEach` hooks
6. Document any new requirements in this README