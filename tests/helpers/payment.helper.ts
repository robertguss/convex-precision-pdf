/**
 * Payment helper functions for Playwright tests
 * Handles Stripe Checkout interactions and subscription management
 */

import { Page, expect } from '@playwright/test';

// Test card numbers from Stripe documentation
export const testCards = {
  valid: {
    number: '4242424242424242',
    exp: '12/34',
    cvc: '123',
    zip: '10001',
  },
  declined: {
    number: '4000000000000002',
    exp: '12/34',
    cvc: '123',
    zip: '10001',
  },
  insufficientFunds: {
    number: '4000000000009995',
    exp: '12/34',
    cvc: '123',
    zip: '10001',
  },
  expired: {
    number: '4000000000000069',
    exp: '12/34',
    cvc: '123',
    zip: '10001',
  },
  processingError: {
    number: '4000000000000119',
    exp: '12/34',
    cvc: '123',
    zip: '10001',
  },
};

/**
 * Navigate to upgrade page for a specific plan
 */
export async function navigateToUpgrade(page: Page, plan: 'pro' | 'business') {
  // Click upgrade button in header or dashboard
  await page.locator('[data-cy="upgrade-button"]').click();
  
  // Wait for pricing page to load
  await page.waitForURL('**/pricing');
  
  // Verify pricing cards are visible
  await expect(page.locator('[data-cy="pricing-cards"]')).toBeVisible();
}

/**
 * Fill Stripe Checkout form with test card details
 */
export async function fillStripeCheckout(page: Page, cardNumber: string = testCards.valid.number) {
  // Wait for Stripe Checkout iframe to load
  await page.waitForSelector('iframe[title*="Stripe"]', { timeout: 15000 });
  
  // Get the Stripe iframe
  const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
  
  // Fill card number
  const cardInput = stripeFrame.locator('[placeholder*="Card number"], [placeholder*="1234"]');
  await cardInput.fill(cardNumber);
  
  // Fill expiry date
  const expiryInput = stripeFrame.locator('[placeholder*="MM / YY"], [placeholder*="Expiry"]');
  await expiryInput.fill(testCards.valid.exp);
  
  // Fill CVC
  const cvcInput = stripeFrame.locator('[placeholder*="CVC"], [placeholder*="CVV"]');
  await cvcInput.fill(testCards.valid.cvc);
  
  // Fill ZIP code if present
  const zipInput = stripeFrame.locator('[placeholder*="ZIP"], [placeholder*="Postal"]');
  if (await zipInput.isVisible()) {
    await zipInput.fill(testCards.valid.zip);
  }
  
  // Fill email if not pre-filled
  const emailInput = stripeFrame.locator('[placeholder*="Email"]');
  if (await emailInput.isVisible()) {
    const currentValue = await emailInput.inputValue();
    if (!currentValue) {
      await emailInput.fill('test@example.com');
    }
  }
}

/**
 * Complete Stripe payment on checkout page
 */
export async function completeStripePayment(page: Page) {
  // Get the Stripe iframe
  const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
  
  // Click the pay/subscribe button
  const payButton = stripeFrame.locator('button[type="submit"], button:has-text("Pay"), button:has-text("Subscribe")');
  await payButton.click();
  
  // Wait for processing
  await page.waitForTimeout(2000);
}

/**
 * Wait for Stripe redirect after payment
 */
export async function waitForStripeRedirect(page: Page, timeout: number = 30000) {
  // Wait for redirect back to our application
  await page.waitForURL('**/dashboard/**', { timeout });
  
  // Wait for success message or subscription update
  const successMessage = page.locator('[data-cy="payment-success"], [data-cy="subscription-updated"]');
  await expect(successMessage).toBeVisible({ timeout: 10000 });
}

/**
 * Wait for webhook processing to complete
 */
export async function waitForWebhookProcessing(page: Page) {
  // Wait for subscription status to update
  await page.waitForTimeout(3000); // Give webhooks time to process
  
  // Refresh to get latest data
  await page.reload();
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
}

/**
 * Verify subscription status
 */
export async function verifySubscription(
  page: Page,
  expectedPlan: string,
  expectedCredits: number
) {
  // Check plan name
  const planElement = page.locator('[data-cy="current-plan"]');
  await expect(planElement).toContainText(expectedPlan);
  
  // Check credit balance
  const creditsElement = page.locator('[data-cy="page-credits"]');
  await expect(creditsElement).toContainText(expectedCredits.toString());
}

/**
 * Navigate to manage subscription page
 */
export async function navigateToManageSubscription(page: Page) {
  // Click on account/settings
  await page.locator('[data-cy="user-menu"]').click();
  await page.locator('[data-cy="settings-link"]').click();
  
  // Click on subscription tab
  await page.locator('[data-cy="subscription-tab"]').click();
  
  // Wait for subscription details to load
  await expect(page.locator('[data-cy="subscription-details"]')).toBeVisible();
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(page: Page) {
  await navigateToManageSubscription(page);
  
  // Click cancel subscription button
  await page.locator('[data-cy="cancel-subscription-button"]').click();
  
  // Confirm cancellation in modal
  await page.locator('[data-cy="confirm-cancel-button"]').click();
  
  // Wait for cancellation to process
  await waitForWebhookProcessing(page);
  
  // Verify cancellation status
  await expect(page.locator('[data-cy="subscription-status"]')).toContainText('Canceled');
}

/**
 * Update payment method
 */
export async function updatePaymentMethod(page: Page, newCardNumber: string) {
  await navigateToManageSubscription(page);
  
  // Click update payment method
  await page.locator('[data-cy="update-payment-button"]').click();
  
  // Wait for Stripe portal or checkout
  await page.waitForURL('**/billing-portal/**', { timeout: 10000 });
  
  // Update card details
  await fillStripeCheckout(page, newCardNumber);
  await completeStripePayment(page);
  
  // Wait for redirect back
  await waitForStripeRedirect(page);
}

/**
 * Simulate payment failure
 */
export async function simulatePaymentFailure(page: Page) {
  // Use a card that will be declined
  await fillStripeCheckout(page, testCards.declined.number);
  await completeStripePayment(page);
  
  // Wait for error message
  const errorMessage = page.locator('[data-cy="payment-error"], .StripeError');
  await expect(errorMessage).toBeVisible({ timeout: 10000 });
}

/**
 * Get subscription renewal date
 */
export async function getSubscriptionRenewalDate(page: Page): Promise<string> {
  await navigateToManageSubscription(page);
  
  const renewalElement = page.locator('[data-cy="renewal-date"]');
  return await renewalElement.textContent() || '';
}

/**
 * Verify grace period status
 */
export async function verifyGracePeriod(page: Page) {
  // Check for grace period warning
  const warningElement = page.locator('[data-cy="grace-period-warning"]');
  await expect(warningElement).toBeVisible();
  
  // Verify limited functionality
  const upgradePrompt = page.locator('[data-cy="upgrade-prompt"]');
  await expect(upgradePrompt).toBeVisible();
}