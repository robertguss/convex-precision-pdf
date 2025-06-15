/**
 * E2E tests for subscription renewal and lifecycle management
 */

import { testCards } from '../../support/test-data';

describe('Subscription Lifecycle', () => {
  beforeEach(() => {
    // Reset database state before each test
    cy.task('resetDatabase');
    cy.task('seedTestUsers');
  });

  describe('Subscription Renewal', () => {
    it('should successfully process automatic renewal', () => {
      // Login as pro user with subscription near renewal
      cy.loginAsUser('pro');
      
      // Simulate subscription near renewal date
      cy.task('setSubscriptionRenewalDate', { daysUntilRenewal: 1 });
      
      // Check account page shows upcoming renewal
      cy.visit('/account');
      cy.get('[data-cy=next-billing-date]').should('be.visible');
      cy.get('[data-cy=renewal-notice]').should('contain', 'renews tomorrow');
      
      // Simulate renewal webhook from Stripe
      cy.task('triggerSubscriptionRenewal');
      
      // Wait for webhook processing
      cy.wait(3000);
      cy.reload();
      
      // Verify renewal processed
      cy.get('[data-cy=last-payment-date]').should('contain', 'Today');
      cy.get('[data-cy=subscription-status]').should('contain', 'Active');
      
      // Credits should be reset to plan amount
      cy.visit('/dashboard');
      cy.get('[data-cy=page-credits]').should('contain', '50');
      
      // Check payment history
      cy.visit('/account');
      cy.get('[data-cy=payment-history]').click();
      cy.get('[data-cy=payment-item]').first().should('contain', 'Renewal');
      cy.get('[data-cy=payment-item]').first().should('contain', '$19.00');
    });

    it('should handle renewal with payment failure', () => {
      cy.loginAsUser('pro');
      
      // Set card to expire before renewal
      cy.task('setCardExpiration', { expired: true });
      cy.task('setSubscriptionRenewalDate', { daysUntilRenewal: 0 });
      
      // Trigger renewal attempt
      cy.task('triggerSubscriptionRenewal', { shouldFail: true });
      
      cy.wait(3000);
      cy.visit('/account');
      
      // Should show payment failure warning
      cy.get('[data-cy=payment-failed-banner]').should('be.visible');
      cy.get('[data-cy=payment-failed-banner]').should('contain', 'Payment failed');
      cy.get('[data-cy=update-payment-method]').should('be.visible');
      
      // Subscription should be in grace period
      cy.get('[data-cy=subscription-status]').should('contain', 'Past due');
      
      // User should still have access during grace period
      cy.visit('/dashboard');
      cy.get('[data-cy=current-plan]').should('contain', 'Pro');
      cy.get('[data-cy buzzing grace-period-warning]').should('be.visible');
    });

    it('should successfully retry payment after updating card', () => {
      cy.loginAsUser('pro');
      
      // Simulate failed renewal
      cy.task('setCardExpiration', { expired: true });
      cy.task('triggerSubscriptionRenewal', { shouldFail: true });
      
      cy.wait(3000);
      cy.visit('/account');
      
      // Update payment method
      cy.get('[data-cy=update-payment-method]').click();
      
      cy.url({ timeout: 10000 }).should('include', 'billing.stripe.com');
      
      cy.origin('https://billing.stripe.com', { args: { testCards } }, ({ testCards }) => {
        // Remove old card
        cy.get('[data-testid="remove-payment-method"]').click();
        cy.get('[data-testid="confirm-remove"]').click();
        
        // Add new card
        cy.get('[data-testid="add-payment-method"]').click();
        cy.get('input[name="cardNumber"]').type(testCards.valid.number);
        cy.get('input[name="cardExpiry"]').type(testCards.valid.expiry);
        cy.get('input[name="cardCvc"]').type(testCards.valid.cvc);
        cy.get('[data-testid="save-payment-method"]').click();
      });
      
      cy.url({ timeout: 10000 }).should('include', '/account');
      
      // Retry payment
      cy.get('[data-cy=retry-payment]').click();
      
      // Wait for processing
      cy.get('[data-cy=payment-processing]').should('be.visible');
      cy.get('[data-cy=payment-processing]', { timeout: 10000 }).should('not.exist');
      
      // Verify payment succeeded
      cy.get('[data-cy=payment-success-banner]').should('be.visible');
      cy.get('[data-cy=subscription-status]').should('contain', 'Active');
      
      // Credits should be restored
      cy.visit('/dashboard');
      cy.get('[data-cy=page-credits]').should('contain', '50');
    });

    it('should suspend subscription after grace period', () => {
      cy.loginAsUser('pro');
      
      // Simulate subscription in grace period
      cy.task('setSubscriptionStatus', { status: 'past_due', daysOverdue: 5 });
      
      cy.visit('/account');
      cy.get('[data-cy=subscription-status]').should('contain', 'Past due');
      cy.get('[data-cy=grace-period-remaining]').should('contain', '2 days');
      
      // Simulate grace period expiration
      cy.task('expireGracePeriod');
      
      cy.reload();
      
      // Subscription should be suspended
      cy.get('[data-cy=subscription-status]').should('contain', 'Suspended');
      cy.get('[data-cy=reactivate-subscription]').should('be.visible');
      
      // User should have limited access
      cy.visit('/dashboard');
      cy.get('[data-cy=account-suspended-banner]').should('be.visible');
      cy.get('[data-cy=page-credits]').should('contain', '0');
      
      // Documents should be read-only
      cy.visit('/documents');
      cy.get('[data-cy=upload-button]').should('be.disabled');
    });
  });

  describe('Credit Management', () => {
    it('should track credit usage across billing periods', () => {
      cy.loginAsUser('pro');
      
      // Check initial credits
      cy.get('[data-cy=page-credits]').should('contain', '50');
      cy.get('[data-cy=credits-used]').should('contain', '0 of 50');
      
      // Use some credits
      cy.task('consumeCredits', { amount: 20 });
      
      cy.reload();
      cy.get('[data-cy=page-credits]').should('contain', '30');
      cy.get('[data-cy=credits-used]').should('contain', '20 of 50');
      
      // Check credit history
      cy.visit('/account');
      cy.get('[data-cy=credit-history]').click();
      cy.get('[data-cy=credit-transaction]').should('have.length.at.least', 1);
      cy.get('[data-cy=credit-transaction]').first().should('contain', '-20');
    });

    it('should reset credits on renewal', () => {
      cy.loginAsUser('pro');
      
      // Use most credits
      cy.task('consumeCredits', { amount: 45 });
      
      cy.reload();
      cy.get('[data-cy=page-credits]').should('contain', '5');
      
      // Trigger renewal
      cy.task('triggerSubscriptionRenewal');
      
      cy.wait(3000);
      cy.reload();
      
      // Credits should be reset
      cy.get('[data-cy=page-credits]').should('contain', '50');
      cy.get('[data-cy=credits-used]').should('contain', '0 of 50');
      
      // Previous period usage should be archived
      cy.visit('/account');
      cy.get('[data-cy=credit-history]').click();
      cy.get('[data-cy=billing-period-selector]').select('Previous');
      cy.get('[data-cy=period-total-used]').should('contain', '45');
    });

    it('should warn when approaching credit limit', () => {
      cy.loginAsUser('pro');
      
      // Use credits to approach limit
      cy.task('consumeCredits', { amount: 40 });
      
      cy.reload();
      
      // Should show warning
      cy.get('[data-cy=credit-warning]').should('be.visible');
      cy.get('[data-cy=credit-warning]').should('contain', '80% of your monthly credits');
      
      // Use more credits to hit 90%
      cy.task('consumeCredits', { amount: 5 });
      cy.reload();
      
      // Should show urgent warning
      cy.get('[data-cy=credit-warning]').should('have.class', 'urgent');
      cy.get('[data-cy=upgrade-suggestion]').should('be.visible');
    });

    it('should handle credit overage', () => {
      cy.loginAsUser('pro');
      
      // Use all credits
      cy.task('consumeCredits', { amount: 50 });
      
      cy.reload();
      cy.get('[data-cy=page-credits]').should('contain', '0');
      
      // Try to use more credits
      cy.visit('/upload');
      cy.uploadFile('test-small.pdf');
      
      // Should show out of credits modal
      cy.get('[data-cy=out-of-credits-modal]').should('be.visible');
      cy.get('[data-cy=out-of-credits-modal]').should('contain', 'You\'re out of credits');
      
      // Options should be presented
      cy.get('[data-cy=upgrade-to-business]').should('be.visible');
      cy.get('[data-cy=wait-for-renewal]').should('be.visible');
      
      // If overage is allowed, show overage pricing
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=enable-overage]').length > 0) {
          cy.get('[data-cy=overage-rate]').should('contain', '$0.50 per page');
        }
      });
    });
  });

  describe('Subscription Modifications', () => {
    it('should handle mid-cycle plan changes', () => {
      cy.loginAsUser('pro');
      
      // Use some credits first
      cy.task('consumeCredits', { amount: 30 });
      
      // Upgrade mid-cycle
      cy.navigateToUpgrade('business');
      cy.get('[data-cy=business-plan-card]').find('[data-cy=upgrade-button]').click();
      
      // Complete upgrade
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      cy.fillStripeCheckout();
      cy.completeStripePayment();
      cy.waitForStripeRedirect();
      cy.waitForWebhookProcessing();
      
      // Credits should be adjusted
      cy.visit('/dashboard');
      cy.get('[data-cy=page-credits]').then(($credits) => {
        const credits = parseInt($credits.text());
        // Should have business credits (200) minus what was used (30) = 170
        expect(credits).to.equal(170);
      });
      
      // Check proration in billing
      cy.visit('/account');
      cy.get('[data-cy=payment-history]').click();
      cy.get('[data-cy=payment-item]').first().should('contain', 'Proration');
    });

    it('should handle pause and resume subscription', () => {
      cy.loginAsUser('pro');
      
      // Pause subscription
      cy.navigateToManageSubscription();
      
      cy.origin('https://billing.stripe.com', () => {
        cy.get('[data-testid="pause-subscription"]').click();
        cy.get('[data-testid="pause-reason"]').select('Temporary break');
        cy.get('[data-testid="resume-date"]').type('2024-03-01');
        cy.get('[data-testid="confirm-pause"]').click();
      });
      
      cy.url({ timeout: 10000 }).should('include', '/account');
      
      // Verify paused state
      cy.get('[data-cy=subscription-status]').should('contain', 'Paused');
      cy.get('[data-cy=resume-date]').should('contain', 'March 1, 2024');
      
      // Should have limited access
      cy.visit('/dashboard');
      cy.get('[data-cy=subscription-paused-banner]').should('be.visible');
      
      // Can still access existing documents
      cy.visit('/documents');
      cy.get('[data-cy=document-item]').should('exist');
      
      // But cannot upload new ones
      cy.get('[data-cy=upload-button]').should('be.disabled');
    });

    it('should handle subscription reactivation', () => {
      cy.loginAsUser('free');
      
      // Assume user had a previous subscription
      cy.task('setPreviousSubscription', { plan: 'pro' });
      
      cy.visit('/account');
      cy.get('[data-cy=reactivate-subscription]').should('be.visible');
      cy.get('[data-cy=previous-plan-info]').should('contain', 'Pro plan');
      
      // Reactivate
      cy.get('[data-cy=reactivate-subscription]').click();
      
      // Should use saved payment method if available
      cy.get('[data-cy=saved-payment-method]').should('be.visible');
      cy.get('[data-cy=confirm-reactivation]').click();
      
      // Wait for processing
      cy.waitForWebhookProcessing();
      
      // Verify reactivated
      cy.verifySubscription('Pro', 50);
    });
  });

  describe('Billing Notifications', () => {
    it('should send renewal reminder emails', () => {
      cy.loginAsUser('pro');
      
      // Set renewal date approaching
      cy.task('setSubscriptionRenewalDate', { daysUntilRenewal: 3 });
      
      // Trigger reminder job
      cy.task('triggerBillingReminders');
      
      // Check email was sent
      cy.task('getLastEmail').then((email: any) => {
        expect(email.subject).to.contain('Subscription renewal reminder');
        expect(email.to).to.contain(testUsers.proUser.email);
        expect(email.html).to.contain('renews in 3 days');
        expect(email.html).to.contain('$19.00');
      });
    });

    it('should notify about failed payments', () => {
      cy.loginAsUser('pro');
      
      // Trigger failed renewal
      cy.task('triggerSubscriptionRenewal', { shouldFail: true });
      
      // Check failure email
      cy.task('getLastEmail').then((email: any) => {
        expect(email.subject).to.contain('Payment failed');
        expect(email.html).to.contain('update your payment method');
        expect(email.html).to.contain('grace period');
      });
      
      // Should also show in-app notification
      cy.visit('/dashboard');
      cy.get('[data-cy=notification-bell]').should('have.class', 'has-notifications');
      cy.get('[data-cy=notification-bell]').click();
      cy.get('[data-cy=notification-item]').first().should('contain', 'Payment failed');
    });

    it('should notify about successful renewals', () => {
      cy.loginAsUser('pro');
      
      // Trigger successful renewal
      cy.task('triggerSubscriptionRenewal');
      
      // Check success email
      cy.task('getLastEmail').then((email: any) => {
        expect(email.subject).to.contain('Payment successful');
        expect(email.html).to.contain('$19.00');
        expect(email.html).to.contain('50 credits');
        expect(email.html).to.contain('View invoice');
      });
    });
  });

  describe('Cancellation Flow', () => {
    it('should handle immediate cancellation', () => {
      cy.loginAsUser('pro');
      
      // Navigate to cancel
      cy.navigateToManageSubscription();
      
      cy.origin('https://billing.stripe.com', () => {
        cy.get('[data-testid="cancel-subscription-button"]').click();
        
        // Select reason
        cy.get('[data-testid="cancellation-reason"]').select('Too expensive');
        cy.get('[data-testid="cancellation-feedback"]').type('Need a more affordable option');
        
        // Choose immediate cancellation
        cy.get('[data-testid="cancel-immediately"]').check();
        cy.get('[data-testid="confirm-cancellation"]').click();
        
        // Final confirmation
        cy.get('[data-testid="final-confirm-cancel"]').click();
      });
      
      cy.url({ timeout: 15000 }).should('include', '/account');
      cy.waitForWebhookProcessing();
      
      // Should be on free plan
      cy.visit('/dashboard');
      cy.get('[data-cy=current-plan]').should('contain', 'Free');
      cy.get('[data-cy=page-credits]').should('contain', '3');
    });

    it('should handle end-of-period cancellation', () => {
      cy.loginAsUser('business');
      
      cy.navigateToManageSubscription();
      
      cy.origin('https://billing.stripe.com', () => {
        cy.get('[data-testid="cancel-subscription-button"]').click();
        
        // Choose end of period
        cy.get('[data-testid="cancel-end-of-period"]').check();
        cy.get('[data-testid="confirm-cancellation"]').click();
        cy.get('[data-testid="final-confirm-cancel"]').click();
      });
      
      cy.url({ timeout: 15000 }).should('include', '/account');
      cy.waitForWebhookProcessing();
      
      // Should still be on business plan
      cy.visit('/dashboard');
      cy.get('[data-cy=current-plan]').should('contain', 'Business');
      cy.get('[data-cy=subscription-ending-notice]').should('be.visible');
      
      // Check account page
      cy.visit('/account');
      cy.get('[data-cy=subscription-status]').should('contain', 'Canceling');
      cy.get('[data-cy=cancellation-date]').should('be.visible');
      cy.get('[data-cy=reactivate-before-cancellation]').should('be.visible');
    });

    it('should allow cancellation reversal', () => {
      cy.loginAsUser('pro');
      
      // Cancel subscription (end of period)
      cy.navigateToManageSubscription();
      
      cy.origin('https://billing.stripe.com', () => {
        cy.get('[data-testid="cancel-subscription-button"]').click();
        cy.get('[data-testid="cancel-end-of-period"]').check();
        cy.get('[data-testid="confirm-cancellation"]').click();
        cy.get('[data-testid="final-confirm-cancel"]').click();
      });
      
      cy.url({ timeout: 15000 }).should('include', '/account');
      cy.waitForWebhookProcessing();
      
      // Reverse cancellation
      cy.get('[data-cy=reactivate-before-cancellation]').click();
      cy.get('[data-cy=confirm-reactivation]').click();
      
      // Wait for processing
      cy.get('[data-cy=processing]').should('be.visible');
      cy.get('[data-cy=processing]', { timeout: 10000 }).should('not.exist');
      
      // Should be active again
      cy.get('[data-cy=subscription-status]').should('contain', 'Active');
      cy.get('[data-cy=cancellation-date]').should('not.exist');
    });
  });
});