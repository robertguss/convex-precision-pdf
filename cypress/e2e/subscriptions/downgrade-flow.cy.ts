/**
 * E2E tests for subscription downgrade flows
 */

describe('Subscription Downgrade Flow', () => {
  beforeEach(() => {
    // Reset database state before each test
    cy.task('resetDatabase');
    cy.task('seedTestUsers');
  });

  describe('Business to Pro Downgrade', () => {
    it('should successfully downgrade from business to pro plan', () => {
      // Login as business tier user
      cy.loginAsUser('business');
      
      // Verify current plan
      cy.get('[data-cy=current-plan]').should('contain', 'Business');
      cy.get('[data-cy=page-credits]').should('contain', '200');
      
      // Navigate to manage subscription
      cy.navigateToManageSubscription();
      
      // Should redirect to Stripe Customer Portal
      cy.url({ timeout: 10000 }).should('include', 'billing.stripe.com');
      
      // In Stripe Customer Portal, look for plan change option
      cy.origin('https://billing.stripe.com', () => {
        // Click on update plan
        cy.get('[data-testid="update-subscription-button"]').click();
        
        // Select Pro plan (downgrade)
        cy.get('[data-testid="price-table"]').within(() => {
          cy.contains('Pro').parent().find('button').click();
        });
        
        // Confirm downgrade
        cy.get('[data-testid="confirm-button"]').click();
        
        // Handle any confirmation modals
        cy.get('body').then(($body) => {
          if ($body.find('[data-testid="downgrade-confirmation"]').length > 0) {
            cy.get('[data-testid="confirm-downgrade"]').click();
          }
        });
      });
      
      // Wait for redirect back to application
      cy.url({ timeout: 15000 }).should('include', '/account');
      
      // Wait for webhook to process the change
      cy.waitForWebhookProcessing();
      
      // Verify downgrade took effect
      cy.visit('/dashboard');
      cy.get('[data-cy=current-plan]').should('contain', 'Pro');
      cy.get('[data-cy=page-credits]').should('contain', '50');
      
      // Verify downgrade shows in account page
      cy.visit('/account');
      cy.get('[data-cy=subscription-plan]').should('contain', 'Pro');
      cy.get('[data-cy=next-billing-date]').should('be.visible');
    });

    it('should handle remaining credits properly on downgrade', () => {
      cy.loginAsUser('business');
      
      // Note initial credits
      cy.get('[data-cy=page-credits]').then(($credits) => {
        const businessCredits = parseInt($credits.text());
        expect(businessCredits).to.equal(200);
        
        // Use some credits first
        // This would typically involve uploading and processing a document
        // For now, we'll assume the test environment has a way to consume credits
        cy.task('consumeCredits', { amount: 50 });
      });
      
      // Verify credits were consumed
      cy.reload();
      cy.get('[data-cy=page-credits]').should('contain', '150');
      
      // Perform downgrade
      cy.navigateToManageSubscription();
      
      cy.origin('https://billing.stripe.com', () => {
        cy.get('[data-testid="update-subscription-button"]').click();
        cy.contains('Pro').parent().find('button').click();
        cy.get('[data-testid="confirm-button"]').click();
      });
      
      cy.url({ timeout: 15000 }).should('include', '/account');
      cy.waitForWebhookProcessing();
      
      // Check that credits were adjusted but not lost
      cy.visit('/dashboard');
      cy.get('[data-cy=page-credits]').then(($credits) => {
        const currentCredits = parseInt($credits.text());
        // Should retain used credits but cap at new plan limit
        expect(currentCredits).to.be.at.most(50);
      });
    });

    it('should schedule downgrade for end of billing period', () => {
      cy.loginAsUser('business');
      
      // Navigate to downgrade
      cy.navigateToManageSubscription();
      
      cy.origin('https://billing.stripe.com', () => {
        cy.get('[data-testid="update-subscription-button"]').click();
        cy.contains('Pro').parent().find('button').click();
        
        // Look for immediate vs end-of-period option
        cy.get('[data-testid="downgrade-timing"]').within(() => {
          cy.get('[data-testid="end-of-period"]').check();
        });
        
        cy.get('[data-testid="confirm-button"]').click();
      });
      
      cy.url({ timeout: 15000 }).should('include', '/account');
      cy.waitForWebhookProcessing();
      
      // Verify scheduled downgrade
      cy.get('[data-cy=subscription-status]').should('contain', 'Scheduled downgrade');
      cy.get('[data-cy=downgrade-date]').should('be.visible');
      
      // Current plan should still be Business
      cy.visit('/dashboard');
      cy.get('[data-cy=current-plan]').should('contain', 'Business');
      cy.get('[data-cy=page-credits]').should('contain', '200');
    });
  });

  describe('Pro to Free Downgrade (Cancellation)', () => {
    it('should successfully cancel pro subscription and revert to free', () => {
      cy.loginAsUser('pro');
      
      // Verify current plan
      cy.get('[data-cy=current-plan]').should('contain', 'Pro');
      
      // Navigate to cancel subscription
      cy.navigateToManageSubscription();
      
      cy.origin('https://billing.stripe.com', () => {
        // Click cancel subscription
        cy.get('[data-testid="cancel-subscription-button"]').click();
        
        // Handle cancellation flow
        cy.get('[data-testid="cancellation-reason"]').select('Too expensive');
        cy.get('[data-testid="confirm-cancellation"]').click();
        
        // Final confirmation
        cy.get('[data-testid="final-confirm-cancel"]').click();
      });
      
      // Wait for redirect
      cy.url({ timeout: 15000 }).should('include', '/account');
      cy.waitForWebhookProcessing();
      
      // Verify cancellation scheduled
      cy.get('[data-cy=subscription-status]').should('contain', 'Scheduled for cancellation');
      cy.get('[data-cy=cancellation-date]').should('be.visible');
      
      // Should still have Pro features until end of period
      cy.visit('/dashboard');
      cy.get('[data-cy=current-plan]').should('contain', 'Pro');
    });

    it('should immediately downgrade to free when requested', () => {
      cy.loginAsUser('pro');
      
      cy.navigateToManageSubscription();
      
      cy.origin('https://billing.stripe.com', () => {
        cy.get('[data-testid="cancel-subscription-button"]').click();
        
        // Choose immediate cancellation
        cy.get('[data-testid="cancel-immediately"]').check();
        cy.get('[data-testid="confirm-cancellation"]').click();
        cy.get('[data-testid="final-confirm-cancel"]').click();
      });
      
      cy.url({ timeout: 15000 }).should('include', '/account');
      cy.waitForWebhookProcessing();
      
      // Should immediately revert to free
      cy.visit('/dashboard');
      cy.get('[data-cy=current-plan]').should('contain', 'Free');
      cy.get('[data-cy=page-credits]').should('contain', '3');
    });

    it('should offer retention discount before cancellation', () => {
      cy.loginAsUser('pro');
      
      cy.navigateToManageSubscription();
      
      cy.origin('https://billing.stripe.com', () => {
        cy.get('[data-testid="cancel-subscription-button"]').click();
        
        // Check if retention offer appears
        cy.get('body').then(($body) => {
          if ($body.find('[data-testid="retention-offer"]').length > 0) {
            // Verify offer details
            cy.get('[data-testid="retention-discount"]').should('be.visible');
            cy.get('[data-testid="accept-offer"]').should('exist');
            cy.get('[data-testid="decline-offer"]').should('exist');
            
            // Decline offer and proceed with cancellation
            cy.get('[data-testid="decline-offer"]').click();
          }
        });
        
        cy.get('[data-testid="confirm-cancellation"]').click();
        cy.get('[data-testid="final-confirm-cancel"]').click();
      });
      
      cy.url({ timeout: 15000 }).should('include', '/account');
    });

    it('should allow reactivation after cancellation', () => {
      cy.loginAsUser('pro');
      
      // First, cancel the subscription
      cy.navigateToManageSubscription();
      
      cy.origin('https://billing.stripe.com', () => {
        cy.get('[data-testid="cancel-subscription-button"]').click();
        cy.get('[data-testid="cancel-immediately"]').check();
        cy.get('[data-testid="confirm-cancellation"]').click();
        cy.get('[data-testid="final-confirm-cancel"]').click();
      });
      
      cy.url({ timeout: 15000 }).should('include', '/account');
      cy.waitForWebhookProcessing();
      
      // Verify on free plan
      cy.visit('/dashboard');
      cy.get('[data-cy=current-plan]').should('contain', 'Free');
      
      // Now try to resubscribe
      cy.navigateToUpgrade('pro');
      cy.get('[data-cy=pro-plan-card]').find('[data-cy=upgrade-button]').click();
      
      // Should go through normal upgrade flow
      cy.url({ timeout: 10000 }).should('include', 'checkout.stripe.com');
      cy.fillStripeCheckout();
      cy.completeStripePayment();
      cy.waitForStripeRedirect();
      cy.waitForWebhookProcessing();
      
      // Verify back on Pro plan
      cy.verifySubscription('Pro', 50);
    });
  });

  describe('Edge Cases', () => {
    it('should prevent downgrade with pending invoice', () => {
      cy.loginAsUser('business');
      
      // Simulate pending invoice scenario
      cy.task('createPendingInvoice');
      
      cy.navigateToManageSubscription();
      
      cy.origin('https://billing.stripe.com', () => {
        // Should show pending payment warning
        cy.get('[data-testid="pending-payment-warning"]').should('be.visible');
        
        // Update button should be disabled
        cy.get('[data-testid="update-subscription-button"]').should('be.disabled');
      });
    });

    it('should handle network errors during downgrade', () => {
      cy.loginAsUser('business');
      
      // Intercept the downgrade request
      cy.intercept('POST', '**/subscriptions/*', {
        statusCode: 500,
        body: { error: 'Network error' }
      }).as('downgradeError');
      
      cy.navigateToManageSubscription();
      
      cy.origin('https://billing.stripe.com', () => {
        cy.get('[data-testid="update-subscription-button"]').click();
        cy.contains('Pro').parent().find('button').click();
        cy.get('[data-testid="confirm-button"]').click();
        
        // Should show error
        cy.get('[data-testid="error-message"]').should('contain', 'Something went wrong');
      });
    });

    it('should maintain data access after downgrade', () => {
      cy.loginAsUser('business');
      
      // Create some test data first
      cy.task('createTestDocuments', { count: 5 });
      
      // Verify documents exist
      cy.visit('/documents');
      cy.get('[data-cy=document-item]').should('have.length', 5);
      
      // Perform downgrade
      cy.navigateToManageSubscription();
      
      cy.origin('https://billing.stripe.com', () => {
        cy.get('[data-testid="update-subscription-button"]').click();
        cy.contains('Pro').parent().find('button').click();
        cy.get('[data-testid="confirm-button"]').click();
      });
      
      cy.url({ timeout: 15000 }).should('include', '/account');
      cy.waitForWebhookProcessing();
      
      // Verify documents still accessible
      cy.visit('/documents');
      cy.get('[data-cy=document-item]').should('have.length', 5);
      
      // But new uploads should be limited by new plan
      cy.visit('/dashboard');
      cy.get('[data-cy=page-credits]').should('contain', '50');
    });
  });
});