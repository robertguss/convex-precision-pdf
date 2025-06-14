/**
 * Payment-specific Cypress commands for Stripe Checkout testing
 */

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Fill Stripe Checkout form with test card details
       * @param cardNumber - Test card number to use
       */
      fillStripeCheckout(cardNumber?: string): Chainable<void>;

      /**
       * Complete Stripe payment on checkout page
       */
      completeStripePayment(): Chainable<void>;

      /**
       * Login as a user with a specific subscription tier
       * @param tier - Subscription tier (free, pro, business)
       */
      loginAsUser(tier: 'free' | 'pro' | 'business'): Chainable<void>;

      /**
       * Wait for Stripe redirect after payment
       * @param timeout - Maximum time to wait
       */
      waitForStripeRedirect(timeout?: number): Chainable<void>;

      /**
       * Verify subscription status
       * @param expectedPlan - Expected plan name
       * @param expectedCredits - Expected credit balance
       */
      verifySubscription(expectedPlan: string, expectedCredits: number): Chainable<void>;

      /**
       * Navigate to upgrade page for a specific plan
       * @param plan - Target plan to upgrade to
       */
      navigateToUpgrade(plan: 'pro' | 'business'): Chainable<void>;

      /**
       * Navigate to manage subscription page
       */
      navigateToManageSubscription(): Chainable<void>;

      /**
       * Wait for webhook processing after payment
       * @param timeout - Maximum time to wait
       */
      waitForWebhookProcessing(timeout?: number): Chainable<void>;
    }
  }
}

// Import test data
import { testUsers, testCards } from './test-data';

// Fill Stripe Checkout
Cypress.Commands.add('fillStripeCheckout', (cardNumber?: string) => {
  const card = cardNumber || testCards.valid.number;
  
  // Wait for Stripe Checkout to load
  cy.origin('https://checkout.stripe.com', { args: { card, testCards } }, ({ card, testCards }) => {
    // Wait for form elements to be ready
    cy.get('input[name="cardNumber"]', { timeout: 10000 }).should('be.visible');
    
    // Fill card details
    cy.get('input[name="cardNumber"]').type(card);
    cy.get('input[name="cardExpiry"]').type(testCards.valid.expiry);
    cy.get('input[name="cardCvc"]').type(testCards.valid.cvc);
    
    // Fill billing information
    cy.get('input[name="billingName"]').type('Test User');
    cy.get('input[name="billingPostalCode"]').type(testCards.valid.zip);
    
    // Some forms may have country selection
    cy.get('body').then(($body) => {
      if ($body.find('select[name="billingCountry"]').length > 0) {
        cy.get('select[name="billingCountry"]').select('US');
      }
    });
  });
});

// Complete Stripe Payment
Cypress.Commands.add('completeStripePayment', () => {
  cy.origin('https://checkout.stripe.com', () => {
    // Click the submit button
    cy.get('button[type="submit"]').click();
    
    // Wait for processing indicator to disappear
    cy.get('.SubmitButton--processing', { timeout: 15000 }).should('not.exist');
    
    // Check for 3D Secure if required
    cy.get('body').then(($body) => {
      if ($body.find('iframe[name="__privateStripeFrame"]').length > 0) {
        // Handle 3D Secure authentication if needed
        cy.log('3D Secure authentication detected - handling test mode');
        cy.wait(2000); // In test mode, 3DS usually auto-completes
      }
    });
  });
});

// Login as user with specific tier
Cypress.Commands.add('loginAsUser', (tier: 'free' | 'pro' | 'business') => {
  const userMap = {
    free: testUsers.freeUser,
    pro: testUsers.proUser,
    business: testUsers.businessUser,
  };
  
  const user = userMap[tier];
  
  // Use the existing signIn command
  cy.signIn(user.email, user.password);
  
  // Wait for dashboard to load
  cy.url().should('include', '/dashboard');
  cy.waitForConvex();
});

// Wait for Stripe redirect
Cypress.Commands.add('waitForStripeRedirect', (timeout = 30000) => {
  // After payment, Stripe redirects back to our success URL
  cy.url({ timeout }).should('not.include', 'checkout.stripe.com');
  cy.url().should('include', '/dashboard');
});

// Verify subscription
Cypress.Commands.add('verifySubscription', (expectedPlan: string, expectedCredits: number) => {
  // Check plan display
  cy.get('[data-cy=current-plan]').should('contain', expectedPlan);
  
  // Check credit balance
  cy.get('[data-cy=page-credits]').should('contain', expectedCredits.toString());
  
  // Additional verification on account page
  cy.visit('/account');
  cy.get('[data-cy=subscription-status]').should('contain', 'Active');
  cy.get('[data-cy=subscription-plan]').should('contain', expectedPlan);
});

// Navigate to upgrade
Cypress.Commands.add('navigateToUpgrade', (plan: 'pro' | 'business') => {
  // Multiple ways to get to upgrade
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy=upgrade-button]').length > 0) {
      // Direct upgrade button
      cy.get('[data-cy=upgrade-button]').click();
    } else {
      // Via pricing page
      cy.visit('/pricing');
    }
  });
  
  // Select the plan
  cy.get(`[data-cy=select-${plan}-plan]`).click();
});

// Navigate to manage subscription
Cypress.Commands.add('navigateToManageSubscription', () => {
  cy.visit('/account');
  cy.get('[data-cy=manage-subscription]').click();
});

// Wait for webhook processing
Cypress.Commands.add('waitForWebhookProcessing', (timeout = 10000) => {
  // After Stripe payment, webhooks update the subscription
  // We wait for the UI to reflect the changes
  cy.wait(2000); // Initial wait for redirect
  
  // Poll for subscription update
  cy.get('[data-cy=subscription-loading]', { timeout }).should('not.exist');
  cy.get('[data-cy=subscription-plan]', { timeout }).should('not.contain', 'Updating');
});

export {};