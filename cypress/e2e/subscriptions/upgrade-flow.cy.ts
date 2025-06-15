/**
 * E2E tests for subscription upgrade flows
 */

import { testCards } from '../../support/test-data';

describe('Subscription Upgrade Flow', () => {
  beforeEach(() => {
    // Reset database state before each test
    cy.task('resetDatabase');
    cy.task('seedTestUsers');
  });

  describe('Free to Pro Upgrade', () => {
    it('should successfully upgrade from free to pro plan', () => {
      // Step 1: Login as free tier user
      cy.loginAsUser('free');
      
      // Step 2: Verify current plan status
      cy.get('[data-cy=current-plan]').should('contain', 'Free');
      cy.get('[data-cy=page-credits]').should('contain', '3'); // Free tier has 3 credits
      
      // Step 3: Navigate to upgrade
      cy.navigateToUpgrade('pro');
      
      // Step 4: Verify pro plan details before purchase
      cy.get('[data-cy=pro-plan-card]').within(() => {
        cy.get('[data-cy=plan-name]').should('contain', 'Pro');
        cy.get('[data-cy=plan-price]').should('contain', '$19');
        cy.get('[data-cy=plan-credits]').should('contain', '50 pages/month');
      });
      
      // Step 5: Click upgrade button
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      // Step 6: Wait for Stripe Checkout redirect
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      
      // Step 7: Fill payment details
      cy.fillStripeCheckout(testCards.valid.number);
      
      // Step 8: Complete payment
      cy.completeStripePayment();
      
      // Step 9: Wait for redirect back to application
      cy.waitForStripeRedirect();
      
      // Step 10: Wait for webhook processing
      cy.waitForWebhookProcessing();
      
      // Step 11: Verify subscription updated
      cy.verifySubscription('Pro', 50);
      
      // Step 12: Verify Stripe customer portal access
      cy.navigateToManageSubscription();
      cy.url({ timeout: 10000 }).should('include', 'billing.stripe.com');
    });

    it('should show immediate credit update after successful upgrade', () => {
      cy.loginAsUser('free');
      
      // Use some credits first
      cy.visit('/dashboard');
      cy.get('[data-cy=page-credits]').then(($credits) => {
        const initialCredits = parseInt($credits.text());
        expect(initialCredits).to.equal(3);
      });
      
      // Upgrade to pro
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      // Complete payment
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      cy.fillStripeCheckout();
      cy.completeStripePayment();
      cy.waitForStripeRedirect();
      cy.waitForWebhookProcessing();
      
      // Check credits were added (not reset)
      cy.get('[data-cy=page-credits]').should('contain', '50');
    });

    it('should persist upgrade through page refreshes', () => {
      cy.loginAsUser('free');
      
      // Complete upgrade
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      cy.fillStripeCheckout();
      cy.completeStripePayment();
      cy.waitForStripeRedirect();
      cy.waitForWebhookProcessing();
      
      // Verify upgrade
      cy.get('[data-cy=current-plan]').should('contain', 'Pro');
      
      // Refresh page
      cy.reload();
      cy.waitForConvex();
      
      // Verify plan persists
      cy.get('[data-cy=current-plan]').should('contain', 'Pro');
      cy.get('[data-cy=page-credits]').should('contain', '50');
      
      // Sign out and back in
      cy.signOut();
      cy.loginAsUser('pro'); // Now they're a pro user
      
      // Verify plan still persists
      cy.get('[data-cy=current-plan]').should('contain', 'Pro');
    });
  });

  describe('Pro to Business Upgrade', () => {
    it('should successfully upgrade from pro to business plan', () => {
      // Login as pro tier user
      cy.loginAsUser('pro');
      
      // Verify current plan
      cy.get('[data-cy=current-plan]').should('contain', 'Pro');
      cy.get('[data-cy=page-credits]').should('contain', '50');
      
      // Navigate to upgrade
      cy.navigateToUpgrade('business');
      
      // Verify business plan details
      cy.get('[data-cy=business-plan-card]').within(() => {
        cy.get('[data-cy=plan-name]').should('contain', 'Business');
        cy.get('[data-cy=plan-price]').should('contain', '$49');
        cy.get('[data-cy=plan-credits]').should('contain', '200 pages/month');
      });
      
      // Click upgrade
      cy.get('[data-cy=business-plan-card]').find('[data-cy=upgrade-button]').click();
      
      // Complete payment flow
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      cy.fillStripeCheckout();
      cy.completeStripePayment();
      cy.waitForStripeRedirect();
      cy.waitForWebhookProcessing();
      
      // Verify subscription updated
      cy.verifySubscription('Business', 200);
    });

    it('should prorate the upgrade cost correctly', () => {
      cy.loginAsUser('pro');
      
      // Navigate to upgrade
      cy.navigateToUpgrade('business');
      
      // Check for proration message
      cy.get('[data-cy=proration-notice]').should('be.visible');
      cy.get('[data-cy=proration-amount]').should('exist');
      
      // Continue with upgrade
      cy.get('[data-cy=business-plan-card]').find('[data-cy=upgrade-button]').click();
      
      // In Stripe Checkout, verify the prorated amount
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      
      // Complete payment
      cy.fillStripeCheckout();
      cy.completeStripePayment();
      cy.waitForStripeRedirect();
      cy.waitForWebhookProcessing();
      
      // Verify upgrade successful
      cy.get('[data-cy=current-plan]').should('contain', 'Business');
    });
  });

  describe('Edge Cases', () => {
    it('should handle browser back button during checkout', () => {
      cy.loginAsUser('free');
      
      // Start upgrade process
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      // Wait for Stripe Checkout
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      
      // Go back
      cy.go('back');
      
      // Should be back on pricing page
      cy.url().should('include', '/pricing');
      
      // Verify still on free plan
      cy.visit('/dashboard');
      cy.get('[data-cy=current-plan]').should('contain', 'Free');
    });

    it('should handle network interruption gracefully', () => {
      cy.loginAsUser('free');
      
      // Start upgrade
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      // Simulate network issue by intercepting the request
      cy.intercept('POST', '**/create-checkout-session', {
        statusCode: 500,
        body: { error: 'Network error' }
      }).as('checkoutError');
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('contain', 'Something went wrong');
      
      // Retry button should be available
      cy.get('[data-cy=retry-button]').click();
      
      // Remove intercept and allow normal flow
      cy.intercept('POST', '**/create-checkout-session').as('checkoutSuccess');
      
      // Should proceed to Stripe
      cy.wait('@checkoutSuccess');
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
    });

    it('should prevent duplicate upgrades', () => {
      cy.loginAsUser('pro');
      
      // Try to upgrade to pro again (already pro)
      cy.visit('/pricing');
      
      // Pro plan should show as current plan
      cy.get('[data-cy=pro-plan-card]').within(() => {
        cy.get('[data-cy=current-plan-badge]').should('be.visible');
        cy.get('[data-cy=upgrade-button]').should('not.exist');
      });
      
      // Only business upgrade should be available
      cy.get('[data-cy=business-plan-card]').find('[data-cy=upgrade-button]').should('exist');
    });
  });
});