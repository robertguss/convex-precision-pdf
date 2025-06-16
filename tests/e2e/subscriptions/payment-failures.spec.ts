/**
 * E2E tests for payment failure scenarios
 */

import { test, expect } from '../../fixtures/test-fixtures';
import { testCards } from '../../helpers/payment.helper';

test.describe('Payment Failure Scenarios', () => {
  test.beforeEach(async ({ database }) => {
    await database.resetDatabase();
    await database.seedTestUsers();
  });

  test.describe('Card Declined', () => {
    test('should handle declined card gracefully', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'free');
      await payment.navigateToUpgrade(page, 'pro');
      
      // Start upgrade
      await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      
      // Use declining card
      await payment.fillStripeCheckout(page, testCards.declined.number);
      await payment.completeStripePayment(page);
      
      // Should show error message
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
      await expect(stripeFrame.locator('.StripeError')).toBeVisible();
      await expect(stripeFrame.locator('.StripeError')).toContainText(/declined/i);
      
      // Should remain on checkout page
      expect(page.url()).toContain('checkout.stripe.com');
    });

    test('should allow retry with different card', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'free');
      await payment.navigateToUpgrade(page, 'pro');
      
      await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      
      // First attempt with declining card
      await payment.fillStripeCheckout(page, testCards.declined.number);
      await payment.completeStripePayment(page);
      
      // Wait for error
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
      await expect(stripeFrame.locator('.StripeError')).toBeVisible();
      
      // Clear and retry with valid card
      const cardInput = stripeFrame.locator('[placeholder*="Card number"]');
      await cardInput.clear();
      await cardInput.fill(testCards.valid.number);
      
      // Complete payment
      await payment.completeStripePayment(page);
      await payment.waitForStripeRedirect(page);
      
      // Verify upgrade successful
      await payment.verifySubscription(page, 'Pro', 50);
    });
  });

  test.describe('Insufficient Funds', () => {
    test('should handle insufficient funds error', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'free');
      await payment.navigateToUpgrade(page, 'business');
      
      await page.locator('[data-cy="business-plan-card"] [data-cy="upgrade-button"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      
      // Use insufficient funds card
      await payment.fillStripeCheckout(page, testCards.insufficientFunds.number);
      await payment.completeStripePayment(page);
      
      // Should show specific error
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
      await expect(stripeFrame.locator('.StripeError')).toBeVisible();
      await expect(stripeFrame.locator('.StripeError')).toContainText(/insufficient funds/i);
    });

    test('should preserve form data after error', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'free');
      await payment.navigateToUpgrade(page, 'pro');
      
      await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      
      // Fill form with test email
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
      const emailInput = stripeFrame.locator('[placeholder*="Email"]');
      await emailInput.fill('test.user@example.com');
      
      // Use declining card
      await payment.fillStripeCheckout(page, testCards.insufficientFunds.number);
      await payment.completeStripePayment(page);
      
      // Wait for error
      await expect(stripeFrame.locator('.StripeError')).toBeVisible();
      
      // Email should still be filled
      await expect(emailInput).toHaveValue('test.user@example.com');
    });
  });

  test.describe('Expired Card', () => {
    test('should detect expired card before submission', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'free');
      await payment.navigateToUpgrade(page, 'pro');
      
      await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
      
      // Fill expired card
      const cardInput = stripeFrame.locator('[placeholder*="Card number"]');
      await cardInput.fill(testCards.expired.number);
      
      // Fill expired date
      const expiryInput = stripeFrame.locator('[placeholder*="MM / YY"]');
      await expiryInput.fill('01/20'); // Past date
      
      // Should show inline validation error
      await expect(stripeFrame.locator('[role="alert"]')).toBeVisible();
      
      // Submit button might be disabled
      const submitButton = stripeFrame.locator('button[type="submit"]');
      const isDisabled = await submitButton.isDisabled();
      
      if (!isDisabled) {
        await submitButton.click();
        await expect(stripeFrame.locator('.StripeError')).toBeVisible();
      }
    });
  });

  test.describe('3D Secure Authentication', () => {
    test('should handle 3D Secure authentication success', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'free');
      await payment.navigateToUpgrade(page, 'pro');
      
      await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      
      // Use 3D Secure test card
      await payment.fillStripeCheckout(page, '4000002500003155'); // Requires 3DS
      await payment.completeStripePayment(page);
      
      // Wait for 3D Secure modal
      await page.waitForSelector('iframe[name*="__privateStripeFrame"]', { timeout: 10000 });
      
      // Complete 3D Secure (in test mode, usually auto-completes)
      const secureFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]');
      const completeButton = secureFrame.locator('button#test-source-authorize-3ds');
      if (await completeButton.isVisible()) {
        await completeButton.click();
      }
      
      // Wait for completion
      await payment.waitForStripeRedirect(page);
      await payment.verifySubscription(page, 'Pro', 50);
    });

    test('should handle 3D Secure authentication failure', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'free');
      await payment.navigateToUpgrade(page, 'pro');
      
      await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      
      // Use 3D Secure fail test card
      await payment.fillStripeCheckout(page, '4000002760003184'); // 3DS will fail
      await payment.completeStripePayment(page);
      
      // Handle 3D Secure failure
      await page.waitForTimeout(3000); // Wait for 3DS to process
      
      // Should show authentication failed error
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
      await expect(stripeFrame.locator('.StripeError')).toBeVisible();
      await expect(stripeFrame.locator('.StripeError')).toContainText(/authentication/i);
    });
  });

  test.describe('Network and Processing Errors', () => {
    test('should handle network timeout gracefully', async ({ page, auth, payment, context }) => {
      await auth.loginAsUser(page, 'free');
      await payment.navigateToUpgrade(page, 'pro');
      
      await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      
      // Fill valid card
      await payment.fillStripeCheckout(page);
      
      // Simulate network issue right before submission
      await context.route('**/checkout.stripe.com/api/**', route => {
        // Delay the request significantly
        setTimeout(() => route.abort(), 30000);
      });
      
      // Try to complete payment
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
      await stripeFrame.locator('button[type="submit"]').click();
      
      // Should eventually show timeout error
      await expect(stripeFrame.locator('.StripeError')).toBeVisible({ timeout: 35000 });
    });

    test('should handle processing error', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'free');
      await payment.navigateToUpgrade(page, 'pro');
      
      await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      
      // Use processing error card
      await payment.fillStripeCheckout(page, testCards.processingError.number);
      await payment.completeStripePayment(page);
      
      // Should show processing error
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
      await expect(stripeFrame.locator('.StripeError')).toBeVisible();
      await expect(stripeFrame.locator('.StripeError')).toContainText(/processing error|try again/i);
    });
  });

  test.describe('Validation Errors', () => {
    test('should validate card number format', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'free');
      await payment.navigateToUpgrade(page, 'pro');
      
      await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
      
      // Enter invalid card number
      const cardInput = stripeFrame.locator('[placeholder*="Card number"]');
      await cardInput.fill('1234567890123456'); // Invalid format
      
      // Move to next field to trigger validation
      const expiryInput = stripeFrame.locator('[placeholder*="MM / YY"]');
      await expiryInput.click();
      
      // Should show validation error
      await expect(stripeFrame.locator('[role="alert"]')).toBeVisible();
    });

    test('should require all fields', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'free');
      await payment.navigateToUpgrade(page, 'pro');
      
      await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
      
      // Try to submit without filling anything
      const submitButton = stripeFrame.locator('button[type="submit"]');
      await submitButton.click();
      
      // Should show validation errors
      await expect(stripeFrame.locator('[role="alert"]')).toBeVisible();
    });
  });

  test.describe('Recovery and Retry', () => {
    test('should show retry button after failure', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'free');
      await payment.navigateToUpgrade(page, 'pro');
      
      await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      
      // Use declining card
      await payment.simulatePaymentFailure(page);
      
      // Go back to app
      await page.goBack();
      
      // Should show retry option
      await expect(page.locator('[data-cy="retry-payment"]')).toBeVisible();
      
      // Click retry
      await page.locator('[data-cy="retry-payment"]').click();
      
      // Should be back at checkout
      await page.waitForURL('**/checkout.stripe.com/**');
    });

    test('should maintain user context through payment failure', async ({ page, auth, payment }) => {
      await auth.loginAsUser(page, 'free');
      
      // Store user info
      const userName = await page.locator('[data-cy="user-name"]').textContent();
      
      await payment.navigateToUpgrade(page, 'pro');
      await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
      await page.waitForURL('**/checkout.stripe.com/**');
      
      // Fail payment
      await payment.simulatePaymentFailure(page);
      
      // Return to app
      await page.goBack();
      
      // Should still be logged in
      await expect(page.locator('[data-cy="user-name"]')).toContainText(userName!);
      await payment.verifySubscription(page, 'Free', 3);
    });
  });
});