/**
 * Main entry point for subscription payment E2E tests
 * 
 * This file imports and organizes all subscription-related tests
 * to ensure they run in the correct order and with proper setup
 */

// Import all test files
import './upgrade-flow.cy';
import './downgrade-flow.cy';
import './payment-failures.cy';
import './subscription-lifecycle.cy';

/**
 * Global setup for all subscription tests
 */
before(() => {
  cy.log('Setting up subscription test environment');
  
  // Ensure we're in test mode
  cy.window().then((win) => {
    (win as any).__STRIPE_TEST_MODE__ = true;
  });
  
  // Set up test webhook endpoint
  cy.intercept('POST', '/api/webhooks/stripe', (req) => {
    // Log webhook events for debugging
    console.log('Stripe webhook received:', req.body);
    req.reply({ received: true });
  }).as('stripeWebhook');
});

/**
 * Global cleanup after all tests
 */
after(() => {
  cy.log('Cleaning up subscription test environment');
  
  // Clean up any test data
  cy.task('resetDatabase');
});