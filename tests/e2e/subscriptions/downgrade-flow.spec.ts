/**
 * E2E tests for subscription downgrade flows
 */

import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Subscription Downgrade Flow', () => {
  test.beforeEach(async ({ database }) => {
    await database.resetDatabase();
    await database.seedTestUsers();
  });

  test.describe('Business to Pro Downgrade', () => {
    test('should successfully downgrade from business to pro', async ({ page, auth, payment }) => {
      // Login as business tier user
      await auth.loginAsUser(page, 'business');
      
      // Verify current plan
      await payment.verifySubscription(page, 'Business', 500);
      
      // Navigate to manage subscription
      await payment.navigateToManageSubscription(page);
      
      // Click change plan
      await page.locator('[data-cy="change-plan-button"]').click();
      
      // Select pro plan
      await page.locator('[data-cy="pro-plan-option"]').click();
      await page.locator('[data-cy="confirm-downgrade-button"]').click();
      
      // Verify downgrade scheduled
      await expect(page.locator('[data-cy="downgrade-scheduled"]')).toBeVisible();
      await expect(page.locator('[data-cy="downgrade-scheduled"]')).toContainText('Pro plan');
      
      // Credits should remain at business level until renewal
      await payment.verifySubscription(page, 'Business', 500);
      
      // Should show scheduled change
      await expect(page.locator('[data-cy="scheduled-change"]')).toContainText('Changing to Pro');
    });

    test('should allow canceling scheduled downgrade', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'business');
      
      // Schedule downgrade
      await payment.navigateToManageSubscription(page);
      await page.locator('[data-cy="change-plan-button"]').click();
      await page.locator('[data-cy="pro-plan-option"]').click();
      await page.locator('[data-cy="confirm-downgrade-button"]').click();
      
      // Cancel the scheduled downgrade
      await page.locator('[data-cy="cancel-scheduled-change"]').click();
      await page.locator('[data-cy="confirm-cancel-change"]').click();
      
      // Verify no scheduled change
      await expect(page.locator('[data-cy="scheduled-change"]')).not.toBeVisible();
      await payment.verifySubscription(page, 'Business', 500);
    });

    test('should preserve used credits when downgrading', async ({ page, auth, payment, database }) => {
      // Use some credits first
      await database.consumeCredits(auth.testUsers.business.id, 100);
      
      await auth.loginAsUser(page, 'business');
      
      // Verify 400 credits remaining
      await expect(page.locator('[data-cy="page-credits"]')).toContainText('400');
      
      // Schedule downgrade
      await payment.navigateToManageSubscription(page);
      await page.locator('[data-cy="change-plan-button"]').click();
      await page.locator('[data-cy="pro-plan-option"]').click();
      await page.locator('[data-cy="confirm-downgrade-button"]').click();
      
      // Credits should not change immediately
      await expect(page.locator('[data-cy="page-credits"]')).toContainText('400');
    });
  });

  test.describe('Pro to Free (Cancellation)', () => {
    test('should successfully cancel pro subscription', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'pro');
      
      // Cancel subscription
      await payment.cancelSubscription(page);
      
      // Verify cancellation scheduled
      await expect(page.locator('[data-cy="subscription-status"]')).toContainText('Canceled');
      await expect(page.locator('[data-cy="cancellation-date"]')).toBeVisible();
      
      // Should still have pro benefits until end of period
      await payment.verifySubscription(page, 'Pro', 50);
    });

    test('should show retention offer when canceling', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'pro');
      await payment.navigateToManageSubscription(page);
      
      // Click cancel subscription
      await page.locator('[data-cy="cancel-subscription-button"]').click();
      
      // Should show retention offer
      await expect(page.locator('[data-cy="retention-offer"]')).toBeVisible();
      await expect(page.locator('[data-cy="retention-discount"]')).toContainText('%');
      
      // Can accept offer
      await page.locator('[data-cy="accept-retention-offer"]').click();
      await expect(page.locator('[data-cy="discount-applied"]')).toBeVisible();
      
      // Subscription should remain active with discount
      await expect(page.locator('[data-cy="subscription-status"]')).toContainText('Active');
    });

    test('should allow reactivation after cancellation', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'pro');
      
      // Cancel subscription
      await payment.cancelSubscription(page);
      
      // Reactivate
      await page.locator('[data-cy="reactivate-subscription"]').click();
      await page.locator('[data-cy="confirm-reactivation"]').click();
      
      // Should be active again
      await payment.waitForWebhookProcessing(page);
      await expect(page.locator('[data-cy="subscription-status"]')).toContainText('Active');
      await expect(page.locator('[data-cy="cancellation-date"]')).not.toBeVisible();
    });
  });

  test.describe('Downgrade Edge Cases', () => {
    test('should prevent creating new documents when over downgraded limit', async ({ page, auth, payment, database }) => {
      // Create documents up to business limit
      await database.createTestDocuments(auth.testUsers.business.id, 10);
      
      await auth.loginAsUser(page, 'business');
      
      // Schedule downgrade to pro
      await payment.navigateToManageSubscription(page);
      await page.locator('[data-cy="change-plan-button"]').click();
      await page.locator('[data-cy="pro-plan-option"]').click();
      await page.locator('[data-cy="confirm-downgrade-button"]').click();
      
      // Navigate to documents
      await page.goto('/documents');
      
      // Should show warning about document limit
      await expect(page.locator('[data-cy="document-limit-warning"]')).toBeVisible();
    });

    test('should handle downgrade with pending invoice', async ({ page, auth, payment, database }) => {
      // Create a pending invoice
      await database.createPendingInvoice(auth.testUsers.business.id, 4900);
      
      await auth.loginAsUser(page, 'business');
      await payment.navigateToManageSubscription(page);
      
      // Try to downgrade
      await page.locator('[data-cy="change-plan-button"]').click();
      
      // Should show pending invoice warning
      await expect(page.locator('[data-cy="pending-invoice-warning"]')).toBeVisible();
      
      // Should not allow downgrade until invoice is paid
      await expect(page.locator('[data-cy="pro-plan-option"]')).toBeDisabled();
    });

    test('should maintain data access after downgrade', async ({ page, auth, payment, database }) => {
      // Create test documents
      await database.createTestDocuments(auth.testUsers.business.id, 5);
      
      await auth.loginAsUser(page, 'business');
      
      // Complete immediate downgrade (simulating end of billing period)
      await database.setSubscriptionStatus(auth.testUsers.business.id, 'active');
      await database.setPreviousSubscription(auth.testUsers.business.id, 'business');
      
      // Force downgrade
      await payment.navigateToManageSubscription(page);
      await page.locator('[data-cy="change-plan-button"]').click();
      await page.locator('[data-cy="pro-plan-option"]').click();
      await page.locator('[data-cy="immediate-downgrade"]').click();
      
      // Navigate to documents
      await page.goto('/documents');
      
      // Should still see all documents
      await expect(page.locator('[data-cy="document-card"]')).toHaveCount(5);
      
      // Should be able to view but not process new documents
      await page.locator('[data-cy="document-card"]').first().click();
      await expect(page.locator('[data-cy="document-viewer"]')).toBeVisible();
      
      // Upload button should show upgrade prompt
      await page.locator('[data-cy="upload-button"]').click();
      await expect(page.locator('[data-cy="upgrade-prompt"]')).toBeVisible();
    });

    test('should handle multiple plan changes in same period', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'business');
      
      // First change: Business to Pro
      await payment.navigateToManageSubscription(page);
      await page.locator('[data-cy="change-plan-button"]').click();
      await page.locator('[data-cy="pro-plan-option"]').click();
      await page.locator('[data-cy="confirm-downgrade-button"]').click();
      
      // Second change: Cancel the scheduled change
      await page.locator('[data-cy="cancel-scheduled-change"]').click();
      await page.locator('[data-cy="confirm-cancel-change"]').click();
      
      // Third change: Business to Free (cancel)
      await payment.cancelSubscription(page);
      
      // Verify final state
      await expect(page.locator('[data-cy="subscription-status"]')).toContainText('Canceled');
      await payment.verifySubscription(page, 'Business', 500); // Still business until end
    });
  });
});