/**
 * E2E tests for payment failure scenarios
 */

import { testCards } from '../../support/test-data';

describe('Payment Failure Scenarios', () => {
  beforeEach(() => {
    // Reset database state before each test
    cy.task('resetDatabase');
    cy.task('seedTestUsers');
  });

  describe('Card Declined', () => {
    it('should handle declined card gracefully', () => {
      cy.loginAsUser('free');
      
      // Navigate to upgrade
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      // Wait for Stripe Checkout
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      
      // Use declined test card
      cy.fillStripeCheckout(testCards.declined.number);
      cy.completeStripePayment();
      
      // Should show decline error in Stripe
      cy.origin('https://checkout.stripe.com', () => {
        cy.get('[data-testid="payment-error"]', { timeout: 5000 }).should('be.visible');
        cy.get('[data-testid="payment-error"]').should('contain', 'declined');
      });
      
      // User should still be able to try another card
      cy.origin('https://checkout.stripe.com', { args: { testCards } }, ({ testCards }) => {
        // Clear the form and try with valid card
        cy.get('input[name="cardNumber"]').clear().type(testCards.valid.number);
        cy.get('button[type="submit"]').click();
      });
      
      // Should succeed with valid card
      cy.waitForStripeRedirect();
      cy.waitForWebhookProcessing();
      cy.verifySubscription('Pro', 50);
    });

    it('should track failed payment attempts', () => {
      cy.loginAsUser('free');
      
      // Try with declined card
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      cy.fillStripeCheckout(testCards.declined.number);
      cy.completeStripePayment();
      
      // Cancel and go back
      cy.origin('https://checkout.stripe.com', () => {
        cy.get('[data-testid="close-button"]').click();
      });
      
      // Should be back on pricing page
      cy.url().should('include', '/pricing');
      
      // Check if failed attempt was logged
      cy.visit('/account');
      cy.get('[data-cy=payment-history]').click();
      cy.get('[data-cy=payment-attempt]').should('contain', 'Failed');
    });
  });

  describe('Insufficient Funds', () => {
    it('should handle insufficient funds error', () => {
      cy.loginAsUser('free');
      
      cy.navigateToUpgrade('business');
      cy.get('[data-cy=business-plan-card]').find('[data-cy=upgrade-button]').click();
      
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      cy.fillStripeCheckout(testCards.insufficientFunds.number);
      cy.completeStripePayment();
      
      // Should show insufficient funds error
      cy.origin('https://checkout.stripe.com', () => {
        cy.get('[data-testid="payment-error"]').should('be.visible');
        cy.get('[data-testid="payment-error"]').should('contain', 'insufficient funds');
      });
      
      // Verify user remains on free plan
      cy.visit('/dashboard');
      cy.get('[data-cy=current-plan]').should('contain', 'Free');
    });

    it('should suggest alternative payment methods', () => {
      cy.loginAsUser('free');
      
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      cy.fillStripeCheckout(testCards.insufficientFunds.number);
      cy.completeStripePayment();
      
      cy.origin('https://checkout.stripe.com', () => {
        // After insufficient funds error
        cy.get('[data-testid="payment-error"]').should('be.visible');
        
        // Should show alternative payment options
        cy.get('[data-testid="payment-method-selector"]').should('be.visible');
        cy.get('[data-testid="use-bank-account"]').should('exist');
      });
    });
  });

  describe('Expired Card', () => {
    it('should detect and handle expired card', () => {
      cy.loginAsUser('free');
      
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      
      // Use expired card
      cy.origin('https://checkout.stripe.com', { args: { testCards } }, ({ testCards }) => {
        cy.get('input[name="cardNumber"]').type(testCards.expired.number);
        cy.get('input[name="cardExpiry"]').type('01/20'); // Past date
        cy.get('input[name="cardCvc"]').type(testCards.expired.cvc);
        cy.get('input[name="billingName"]').type('Test User');
        cy.get('input[name="billingPostalCode"]').type(testCards.expired.zip);
        
        // Should show inline validation error
        cy.get('[data-testid="expiry-error"]').should('contain', 'expired');
        
        // Submit button should be disabled
        cy.get('button[type="submit"]').should('be.disabled');
      });
    });

    it('should handle expired card during renewal', () => {
      // This test simulates a subscription renewal with an expired card
      cy.loginAsUser('pro');
      
      // Simulate that the card on file has expired
      cy.task('expireUserCard');
      
      // Check account page for payment method warning
      cy.visit('/account');
      cy.get('[data-cy=payment-method-warning]').should('be.visible');
      cy.get('[data-cy=payment-method-warning]').should('contain', 'expired');
      
      // Update payment method
      cy.get('[data-cy=update-payment-method]').click();
      
      // Should redirect to Stripe
      cy.url({ timeout: 10000 }).should('include', 'billing.stripe.com');
      
      cy.origin('https://billing.stripe.com', { args: { testCards } }, ({ testCards }) => {
        cy.get('[data-testid="add-payment-method"]').click();
        cy.get('input[name="cardNumber"]').type(testCards.valid.number);
        cy.get('input[name="cardExpiry"]').type(testCards.valid.expiry);
        cy.get('input[name="cardCvc"]').type(testCards.valid.cvc);
        cy.get('[data-testid="save-payment-method"]').click();
      });
      
      // Verify payment method updated
      cy.url({ timeout: 10000 }).should('include', '/account');
      cy.get('[data-cy=payment-method-warning]').should('not.exist');
    });
  });

  describe('3D Secure Authentication', () => {
    it('should handle 3D Secure authentication flow', () => {
      cy.loginAsUser('free');
      
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      
      // Use card that requires 3DS
      cy.fillStripeCheckout('4000002500003155'); // Stripe 3DS test card
      cy.completeStripePayment();
      
      // Handle 3DS authentication
      cy.origin('https://checkout.stripe.com', () => {
        // Wait for 3DS iframe
        cy.get('iframe[name="__privateStripeFrame"]', { timeout: 10000 }).should('exist');
        
        // In test mode, 3DS usually auto-completes
        // But we wait to ensure it processes
        cy.wait(3000);
      });
      
      // Should complete after 3DS
      cy.waitForStripeRedirect();
      cy.waitForWebhookProcessing();
      cy.verifySubscription('Pro', 50);
    });

    it('should handle 3D Secure authentication failure', () => {
      cy.loginAsUser('free');
      
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      
      // Use card that will fail 3DS
      cy.fillStripeCheckout('4000008400001629'); // 3DS always fails
      cy.completeStripePayment();
      
      // Should show authentication failed error
      cy.origin('https://checkout.stripe.com', () => {
        cy.get('[data-testid="payment-error"]', { timeout: 10000 }).should('be.visible');
        cy.get('[data-testid="payment-error"]').should('contain', 'authentication');
      });
      
      // User should remain on free plan
      cy.visit('/dashboard');
      cy.get('[data-cy=current-plan]').should('contain', 'Free');
    });
  });

  describe('Network and Timeout Issues', () => {
    it('should handle network timeout during payment', () => {
      cy.loginAsUser('free');
      
      // Intercept and delay the payment request
      cy.intercept('POST', '**/payment_intents/*/confirm', (req) => {
        req.reply((res) => {
          res.delay(35000); // Delay longer than timeout
          res.send({ statusCode: 504 });
        });
      }).as('paymentTimeout');
      
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      cy.fillStripeCheckout();
      cy.completeStripePayment();
      
      // Should show timeout error
      cy.origin('https://checkout.stripe.com', () => {
        cy.get('[data-testid="payment-error"]', { timeout: 40000 }).should('be.visible');
        cy.get('[data-testid="payment-error"]').should('contain', 'timed out');
      });
    });

    it('should recover from temporary network failure', () => {
      cy.loginAsUser('free');
      
      let attemptCount = 0;
      
      // Fail first attempt, succeed on second
      cy.intercept('POST', '**/payment_intents/*/confirm', (req) => {
        attemptCount++;
        if (attemptCount === 1) {
          req.reply({ statusCode: 500, body: { error: 'Network error' } });
        } else {
          req.continue();
        }
      }).as('paymentRequest');
      
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      cy.fillStripeCheckout();
      cy.completeStripePayment();
      
      // First attempt should fail
      cy.wait('@paymentRequest');
      
      cy.origin('https://checkout.stripe.com', () => {
        // Error should appear
        cy.get('[data-testid="payment-error"]').should('be.visible');
        
        // Retry button should be available
        cy.get('[data-testid="retry-payment"]').click();
      });
      
      // Second attempt should succeed
      cy.wait('@paymentRequest');
      cy.waitForStripeRedirect();
      cy.waitForWebhookProcessing();
      cy.verifySubscription('Pro', 50);
    });
  });

  describe('Invalid Payment Details', () => {
    it('should validate card number format', () => {
      cy.loginAsUser('free');
      
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      
      cy.origin('https://checkout.stripe.com', () => {
        // Try invalid card number
        cy.get('input[name="cardNumber"]').type('1234567890123456');
        cy.get('input[name="cardExpiry"]').type('12/30');
        
        // Should show validation error
        cy.get('[data-testid="card-error"]').should('contain', 'Invalid card number');
        cy.get('button[type="submit"]').should('be.disabled');
      });
    });

    it('should validate billing zip code', () => {
      cy.loginAsUser('free');
      
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      
      cy.origin('https://checkout.stripe.com', { args: { testCards } }, ({ testCards }) => {
        cy.get('input[name="cardNumber"]').type(testCards.valid.number);
        cy.get('input[name="cardExpiry"]').type(testCards.valid.expiry);
        cy.get('input[name="cardCvc"]').type(testCards.valid.cvc);
        cy.get('input[name="billingName"]').type('Test User');
        
        // Invalid zip code
        cy.get('input[name="billingPostalCode"]').type('ABCDE');
        
        // Submit to trigger validation
        cy.get('button[type="submit"]').click();
        
        // Should show zip code error
        cy.get('[data-testid="zip-error"]').should('be.visible');
      });
    });
  });

  describe('Recovery and Retry Logic', () => {
    it('should allow multiple payment retry attempts', () => {
      cy.loginAsUser('free');
      
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      
      // First attempt with declined card
      cy.fillStripeCheckout(testCards.declined.number);
      cy.completeStripePayment();
      
      cy.origin('https://checkout.stripe.com', { args: { testCards } }, ({ testCards }) => {
        cy.get('[data-testid="payment-error"]').should('be.visible');
        
        // Second attempt with insufficient funds
        cy.get('input[name="cardNumber"]').clear().type(testCards.insufficientFunds.number);
        cy.get('button[type="submit"]').click();
        cy.get('[data-testid="payment-error"]').should('contain', 'insufficient');
        
        // Third attempt with valid card
        cy.get('input[name="cardNumber"]').clear().type(testCards.valid.number);
        cy.get('button[type="submit"]').click();
      });
      
      // Should succeed on third attempt
      cy.waitForStripeRedirect();
      cy.waitForWebhookProcessing();
      cy.verifySubscription('Pro', 50);
    });

    it('should preserve form data after error', () => {
      cy.loginAsUser('free');
      
      cy.navigateToUpgrade('business');
      cy.get('[data-cy=business-plan-card]').find('[data-cy=upgrade-button]').click();
      
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      
      cy.origin('https://checkout.stripe.com', { args: { testCards } }, ({ testCards }) => {
        // Fill form with declined card
        cy.get('input[name="cardNumber"]').type(testCards.declined.number);
        cy.get('input[name="cardExpiry"]').type(testCards.declined.expiry);
        cy.get('input[name="cardCvc"]').type(testCards.declined.cvc);
        cy.get('input[name="billingName"]').type('John Doe');
        cy.get('input[name="billingPostalCode"]').type('90210');
        
        // Submit
        cy.get('button[type="submit"]').click();
        
        // After error, verify other fields preserved
        cy.get('[data-testid="payment-error"]').should('be.visible');
        cy.get('input[name="billingName"]').should('have.value', 'John Doe');
        cy.get('input[name="billingPostalCode"]').should('have.value', '90210');
        
        // Only need to update card number
        cy.get('input[name="cardNumber"]').clear().type(testCards.valid.number);
        cy.get('button[type="submit"]').click();
      });
      
      cy.waitForStripeRedirect();
      cy.waitForWebhookProcessing();
      cy.verifySubscription('Business', 200);
    });
  });
});