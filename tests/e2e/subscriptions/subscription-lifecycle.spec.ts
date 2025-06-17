/**
 * E2E tests for subscription lifecycle events
 */

import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Subscription Lifecycle', () => {
  test.beforeEach(async ({ database }) => {
    await database.resetDatabase();
    await database.seedTestUsers();
  });

  test.describe('Automatic Renewal', () => {
    test('should process successful renewal', async ({ page, auth, payment, database }) => {
      await auth.loginAsUser(page, 'pro');
      
      // Set renewal date to today
      await database.setSubscriptionRenewalDate(auth.testUsers.pro.id, 0);
      
      // Trigger renewal webhook
      await database.triggerSubscriptionRenewal(auth.testUsers.pro.id, false);
      
      // Wait for processing
      await page.waitForTimeout(2000);
      await page.reload();
      
      // Credits should be reset
      await payment.verifySubscription(page, 'Pro', 50);
      
      // Check payment history
      await page.locator('[data-cy="payment-history"]').click();
      await expect(page.locator('[data-cy="payment-row"]').first()).toContainText('Renewal');
      await expect(page.locator('[data-cy="payment-row"]').first()).toContainText('$19.00');
    });

    test('should handle renewal payment failure', async ({ page, auth, payment, database }) => {
      await auth.loginAsUser(page, 'pro');
      
      // Use some credits first
      await database.consumeCredits(auth.testUsers.pro.id, 30);
      
      // Set renewal date to today
      await database.setSubscriptionRenewalDate(auth.testUsers.pro.id, 0);
      
      // Trigger failed renewal
      await database.triggerSubscriptionRenewal(auth.testUsers.pro.id, true);
      
      await page.reload();
      
      // Should show payment failed banner
      await expect(page.locator('[data-cy="payment-failed-banner"]')).toBeVisible();
      
      // Credits should not be reset
      await expect(page.locator('[data-cy="page-credits"]')).toContainText('20');
      
      // Should have update payment method button
      await expect(page.locator('[data-cy="update-payment-method"]')).toBeVisible();
    });

    test('should enter grace period after payment failure', async ({ page, auth, payment, database }) => {
      await auth.loginAsUser(page, 'pro');
      
      // Simulate payment failure
      await database.setSubscriptionStatus(auth.testUsers.pro.id, 'past_due');
      
      await page.reload();
      
      // Should show grace period warning
      await expect(page.locator('[data-cy="grace-period-warning"]')).toBeVisible();
      await expect(page.locator('[data-cy="grace-period-warning"]')).toContainText(/days remaining/i);
      
      // Should still have access to features
      await page.goto('/documents');
      await page.locator('[data-cy="upload-button"]').click();
      await expect(page.locator('[data-cy="file-upload-modal"]')).toBeVisible();
    });
  });

  test.describe('Credit Management', () => {
    test('should track credit usage accurately', async ({ page, auth, payment, database, document }) => {
      await auth.loginAsUser(page, 'pro');
      
      // Initial credits
      await expect(page.locator('[data-cy="page-credits"]')).toContainText('50');
      
      // Upload and process a document
      await page.goto('/documents');
      await document.uploadFile(page, 'test-small.pdf');
      await document.waitForProcessing(page);
      
      // Credits should be reduced
      await page.goto('/dashboard');
      const creditsText = await page.locator('[data-cy="page-credits"]').textContent();
      const credits = parseInt(creditsText || '0');
      expect(credits).toBeLessThan(50);
      expect(credits).toBeGreaterThan(40); // Small PDF shouldn't use more than 10 credits
    });

    test('should show credit warning at threshold', async ({ page, auth, payment, database }) => {
      // Consume credits to near limit
      await database.consumeCredits(auth.testUsers.pro.id, 45);
      
      await auth.loginAsUser(page, 'pro');
      
      // Should show low credit warning
      await expect(page.locator('[data-cy="credit-warning"]')).toBeVisible();
      await expect(page.locator('[data-cy="credit-warning"]')).toContainText(/5 credits remaining/i);
    });

    test('should prevent actions when out of credits', async ({ page, auth, payment, database }) => {
      // Use all credits
      await database.consumeCredits(auth.testUsers.pro.id, 50);
      
      await auth.loginAsUser(page, 'pro');
      
      // Try to upload document
      await page.goto('/documents');
      await page.locator('[data-cy="upload-button"]').click();
      
      // Should show out of credits modal
      await expect(page.locator('[data-cy="out-of-credits-modal"]')).toBeVisible();
      await expect(page.locator('[data-cy="upgrade-to-business"]')).toBeVisible();
    });

    test('should reset credits on renewal date', async ({ page, auth, payment, database }) => {
      // Use most credits
      await database.consumeCredits(auth.testUsers.pro.id, 48);
      
      await auth.loginAsUser(page, 'pro');
      await expect(page.locator('[data-cy="page-credits"]')).toContainText('2');
      
      // Simulate successful renewal
      await database.setSubscriptionRenewalDate(auth.testUsers.pro.id, 0);
      await database.triggerSubscriptionRenewal(auth.testUsers.pro.id, false);
      
      await page.waitForTimeout(2000);
      await page.reload();
      
      // Credits should be reset
      await expect(page.locator('[data-cy="page-credits"]')).toContainText('50');
    });
  });

  test.describe('Mid-cycle Changes', () => {
    test('should handle immediate upgrade with proration', async ({ page, auth, payment, database }) => {
      // Set to mid-cycle
      await database.setSubscriptionRenewalDate(auth.testUsers.pro.id, 15);
      
      await auth.loginAsUser(page, 'pro');
      
      // Use some credits
      await database.consumeCredits(auth.testUsers.pro.id, 20);
      await page.reload();
      await expect(page.locator('[data-cy="page-credits"]')).toContainText('30');
      
      // Upgrade to business
      await payment.navigateToUpgrade(page, 'business');
      await page.locator('[data-cy="business-plan-card"] [data-cy="upgrade-button"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      await payment.fillStripeCheckout(page);
      await payment.completeStripePayment(page);
      await payment.waitForStripeRedirect(page);
      
      // Should have business credits immediately
      await expect(page.locator('[data-cy="page-credits"]')).toContainText('500');
    });

    test('should schedule downgrade for end of period', async ({ page, auth, payment, database }) => {
      // Set to mid-cycle
      await database.setSubscriptionRenewalDate(auth.testUsers.business.id, 20);
      
      await auth.loginAsUser(page, 'business');
      
      // Downgrade to pro
      await payment.navigateToManageSubscription(page);
      await page.locator('[data-cy="change-plan-button"]').click();
      await page.locator('[data-cy="pro-plan-option"]').click();
      await page.locator('[data-cy="confirm-downgrade-button"]').click();
      
      // Should show scheduled for renewal date
      const renewalDate = await page.locator('[data-cy="scheduled-change-date"]').textContent();
      expect(renewalDate).toContain('20 days');
      
      // Credits should remain at business level
      await expect(page.locator('[data-cy="page-credits"]')).toContainText('500');
    });
  });

  test.describe('Pause and Resume', () => {
    test('should pause subscription at end of period', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'pro');
      
      await payment.navigateToManageSubscription(page);
      
      // Click pause subscription
      await page.locator('[data-cy="pause-subscription-button"]').click();
      await page.locator('[data-cy="confirm-pause"]').click();
      
      // Should show paused scheduled
      await expect(page.locator('[data-cy="pause-scheduled"]')).toBeVisible();
      await expect(page.locator('[data-cy="subscription-status"]')).toContainText('Active');
      
      // Can cancel pause
      await page.locator('[data-cy="cancel-pause"]').click();
      await expect(page.locator('[data-cy="pause-scheduled"]')).not.toBeVisible();
    });

    test('should maintain read-only access when paused', async ({ page, auth, payment, database }) => {
      // Set subscription as paused
      await database.setSubscriptionStatus(auth.testUsers.pro.id, 'canceled');
      
      await auth.loginAsUser(page, 'pro');
      
      // Should show paused state
      await expect(page.locator('[data-cy="subscription-status"]')).toContainText('Paused');
      
      // Can view documents
      await page.goto('/documents');
      await expect(page.locator('[data-cy="document-list"]')).toBeVisible();
      
      // Cannot upload new documents
      await page.locator('[data-cy="upload-button"]').click();
      await expect(page.locator('[data-cy="subscription-paused-modal"]')).toBeVisible();
    });

    test('should resume subscription', async ({ page, auth, payment, database }) => {
      // Set as paused
      await database.setSubscriptionStatus(auth.testUsers.pro.id, 'canceled');
      
      await auth.loginAsUser(page, 'pro');
      await payment.navigateToManageSubscription(page);
      
      // Resume subscription
      await page.locator('[data-cy="resume-subscription-button"]').click();
      await page.locator('[data-cy="confirm-resume"]').click();
      
      await payment.waitForWebhookProcessing(page);
      
      // Should be active again
      await expect(page.locator('[data-cy="subscription-status"]')).toContainText('Active');
      await payment.verifySubscription(page, 'Pro', 50);
    });
  });

  test.describe('Billing Notifications', () => {
    test('should send renewal reminder emails', async ({ page, auth, payment, database }) => {
      // Set renewal in 3 days
      await database.setSubscriptionRenewalDate(auth.testUsers.pro.id, 3);
      
      // Trigger billing reminders
      await database.triggerBillingReminders();
      
      // Check email was sent
      const email = await database.getLastEmail();
      expect(email.to).toBe(auth.testUsers.pro.email);
      expect(email.subject).toContain('renewal reminder');
      expect(email.html).toContain('3 days');
      expect(email.html).toContain('$19');
    });

    test('should notify on payment failure', async ({ page, auth, payment, database }) => {
      await auth.loginAsUser(page, 'pro');
      
      // Trigger failed payment
      await database.triggerSubscriptionRenewal(auth.testUsers.pro.id, true);
      
      // Check notification
      await page.reload();
      await expect(page.locator('[data-cy="notification-badge"]')).toBeVisible();
      
      // Click to view
      await page.locator('[data-cy="notifications-button"]').click();
      await expect(page.locator('[data-cy="notification-item"]').first()).toContainText('Payment failed');
    });

    test('should show card expiration warning', async ({ page, auth, payment, database }) => {
      // Set card as expiring soon
      await database.setCardExpiration(auth.testUsers.pro.id, true);
      
      await auth.loginAsUser(page, 'pro');
      
      // Should show expiration warning
      await expect(page.locator('[data-cy="card-expiring-warning"]')).toBeVisible();
      await expect(page.locator('[data-cy="update-card-button"]')).toBeVisible();
    });
  });

  test.describe('Grace Period Management', () => {
    test('should allow payment retry during grace period', async ({ page, auth, payment, database }) => {
      // Set subscription in grace period
      await database.setSubscriptionStatus(auth.testUsers.pro.id, 'past_due');
      
      await auth.loginAsUser(page, 'pro');
      
      // Update payment method
      await page.locator('[data-cy="update-payment-method"]').click();
      await page.waitForURL('**/billing-portal/**');
      
      // Update card
      await payment.updatePaymentMethod(page, testCards.valid.number);
      
      // Should reactivate subscription
      await expect(page.locator('[data-cy="subscription-status"]')).toContainText('Active');
      await expect(page.locator('[data-cy="grace-period-warning"]')).not.toBeVisible();
    });

    test('should suspend access after grace period expires', async ({ page, auth, payment, database }) => {
      // Set subscription as unpaid after grace period
      await database.setSubscriptionStatus(auth.testUsers.pro.id, 'unpaid');
      await database.expireGracePeriod();
      
      await auth.loginAsUser(page, 'pro');
      
      // Should show suspended
      await expect(page.locator('[data-cy="subscription-suspended"]')).toBeVisible();
      
      // Cannot access features
      await page.goto('/documents');
      await page.locator('[data-cy="upload-button"]').click();
      await expect(page.locator('[data-cy="subscription-suspended-modal"]')).toBeVisible();
      
      // Can still update payment to reactivate
      await expect(page.locator('[data-cy="reactivate-subscription"]')).toBeVisible();
    });
  });

  test.describe('Cancellation Flow', () => {
    test('should handle full cancellation flow', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'business');
      
      // Start cancellation
      await payment.navigateToManageSubscription(page);
      await page.locator('[data-cy="cancel-subscription-button"]').click();
      
      // Show survey
      await expect(page.locator('[data-cy="cancellation-survey"]')).toBeVisible();
      
      // Select reason
      await page.locator('[data-cy="cancel-reason-too-expensive"]').click();
      await page.locator('[data-cy="submit-cancellation"]').click();
      
      // Confirm cancellation
      await page.locator('[data-cy="confirm-cancel-button"]').click();
      
      // Should be scheduled for end of period
      await expect(page.locator('[data-cy="subscription-status"]')).toContainText('Canceled');
      await expect(page.locator('[data-cy="access-until"]')).toBeVisible();
      
      // Should still have access
      await payment.verifySubscription(page, 'Business', 500);
    });

    test('should offer win-back after cancellation', async ({ page, auth, payment, database }) => {
      // Set as recently canceled
      await database.setSubscriptionStatus(auth.testUsers.pro.id, 'canceled');
      await database.setPreviousSubscription(auth.testUsers.pro.id, 'pro');
      
      await auth.loginAsUser(page, 'free'); // Now on free tier
      
      // Should show win-back offer
      await expect(page.locator('[data-cy="win-back-offer"]')).toBeVisible();
      await expect(page.locator('[data-cy="special-discount"]')).toContainText('%');
      
      // Can accept offer
      await page.locator('[data-cy="accept-win-back"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      
      // Verify discounted price
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
      await expect(stripeFrame.locator('.OrderDetails-amount')).not.toContainText('$19.00');
    });
  });
});