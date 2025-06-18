/**
 * E2E tests for subscription upgrade flows
 */

import { test, expect } from "../../fixtures/test-fixtures";
import { testCards } from "../../helpers/payment.helper";

test.describe("Subscription Upgrade Flow", () => {
  test.beforeEach(async ({ database }) => {
    await database.resetDatabase();
    await database.seedTestUsers();
  });

  test.describe("Free to Pro Upgrade", () => {
    test("should successfully upgrade from free to pro plan", async ({
      page,
      auth,
      payment,
    }) => {
      // Step 1: Login as free tier user
      await auth.loginAsUser(page, "free");

      // Step 2: Verify current plan status
      await expect(page.locator('[data-cy="current-plan"]')).toContainText(
        "Free",
      );
      await expect(page.locator('[data-cy="page-credits"]')).toContainText("3");

      // Step 3: Navigate to upgrade
      await payment.navigateToUpgrade(page, "pro");

      // Step 4: Verify pro plan details before purchase
      const proPlanCard = page.locator('[data-cy="pro-plan-card"]');
      await expect(proPlanCard.locator('[data-cy="plan-name"]')).toContainText(
        "Pro",
      );
      await expect(proPlanCard.locator('[data-cy="plan-price"]')).toContainText(
        "$19",
      );
      await expect(
        proPlanCard.locator('[data-cy="plan-credits"]'),
      ).toContainText("50 pages/month");

      // Step 5: Click upgrade button
      await proPlanCard.locator('[data-cy="upgrade-button"]').click();

      // Step 6: Wait for Stripe Checkout redirect
      await page.waitForURL("**/checkout.stripe.com/**", { timeout: 10000 });

      // Step 7: Fill payment details
      await payment.fillStripeCheckout(page, testCards.valid.number);

      // Step 8: Complete payment
      await payment.completeStripePayment(page);

      // Step 9: Wait for redirect back to application
      await payment.waitForStripeRedirect(page);

      // Step 10: Wait for webhook processing
      await payment.waitForWebhookProcessing(page);

      // Step 11: Verify subscription updated
      await payment.verifySubscription(page, "Pro", 50);

      // Step 12: Verify payment history shows the transaction
      await page.locator('[data-cy="payment-history"]').click();
      await expect(
        page.locator('[data-cy="payment-row"]').first(),
      ).toContainText("$19.00");
    });

    test("should handle upgrade interruption gracefully", async ({
      page,
      auth,
      payment,
    }) => {
      await auth.loginAsUser(page, "free");
      await payment.navigateToUpgrade(page, "pro");

      // Start upgrade process
      await page
        .locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]')
        .click();

      // Simulate browser back button during checkout
      await page.waitForURL("**/checkout.stripe.com/**");
      await page.goBack();

      // Verify we're back on pricing page
      await expect(page).toHaveURL(/.*pricing/);

      // Verify still on free plan
      await page.goto("/dashboard");
      await payment.verifySubscription(page, "Free", 3);
    });

    test("should prevent duplicate upgrades", async ({
      page,
      auth,
      payment,
    }) => {
      await auth.loginAsUser(page, "free");

      // Start first upgrade
      await payment.navigateToUpgrade(page, "pro");
      await page
        .locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]')
        .click();

      // Open second tab and try to upgrade again
      const newPage = await page.context().newPage();
      await auth.loginAsUser(newPage, "free");
      await payment.navigateToUpgrade(newPage, "pro");

      // Should show already upgrading message
      await expect(
        newPage.locator('[data-cy="upgrade-in-progress"]'),
      ).toBeVisible();

      await newPage.close();
    });
  });

  test.describe("Pro to Business Upgrade", () => {
    test("should successfully upgrade from pro to business plan", async ({
      page,
      auth,
      payment,
    }) => {
      // Login as pro tier user
      await auth.loginAsUser(page, "pro");

      // Verify current plan
      await payment.verifySubscription(page, "Pro", 50);

      // Navigate to upgrade
      await payment.navigateToUpgrade(page, "business");

      // Verify business plan details
      const businessCard = page.locator('[data-cy="business-plan-card"]');
      await expect(businessCard.locator('[data-cy="plan-name"]')).toContainText(
        "Business",
      );
      await expect(
        businessCard.locator('[data-cy="plan-price"]'),
      ).toContainText("$49");
      await expect(
        businessCard.locator('[data-cy="plan-credits"]'),
      ).toContainText("500 pages/month");

      // Complete upgrade
      await businessCard.locator('[data-cy="upgrade-button"]').click();
      await page.waitForURL("**/checkout.stripe.com/**");
      await payment.fillStripeCheckout(page);
      await payment.completeStripePayment(page);
      await payment.waitForStripeRedirect(page);
      await payment.waitForWebhookProcessing(page);

      // Verify upgraded to business
      await payment.verifySubscription(page, "Business", 500);
    });

    test("should handle proration correctly", async ({
      page,
      auth,
      payment,
      database,
    }) => {
      // Set subscription to mid-cycle
      await database.setSubscriptionRenewalDate(auth.testUsers.pro.id, 15);

      await auth.loginAsUser(page, "pro");
      await payment.navigateToUpgrade(page, "business");

      // Check proration amount is shown
      await expect(page.locator('[data-cy="proration-amount"]')).toBeVisible();
      await expect(page.locator('[data-cy="proration-amount"]')).toContainText(
        "$",
      );

      // Complete upgrade
      await page
        .locator('[data-cy="business-plan-card"] [data-cy="upgrade-button"]')
        .click();
      await page.waitForURL("**/checkout.stripe.com/**");

      // Verify prorated amount in Stripe checkout
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
      await expect(stripeFrame.locator(".OrderDetails-amount")).toContainText(
        "$",
      );
    });
  });

  test.describe("Upgrade Edge Cases", () => {
    test("should maintain credits immediately after upgrade", async ({
      page,
      auth,
      payment,
      database,
    }) => {
      // Consume some credits first
      await database.consumeCredits(auth.testUsers.free.id, 2);

      await auth.loginAsUser(page, "free");

      // Verify only 1 credit left
      await expect(page.locator('[data-cy="page-credits"]')).toContainText("1");

      // Upgrade to pro
      await payment.navigateToUpgrade(page, "pro");
      await page
        .locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]')
        .click();
      await page.waitForURL("**/checkout.stripe.com/**");
      await payment.fillStripeCheckout(page);
      await payment.completeStripePayment(page);
      await payment.waitForStripeRedirect(page);

      // Should immediately have pro credits
      await expect(page.locator('[data-cy="page-credits"]')).toContainText(
        "50",
      );
    });

    test("should persist upgrade through page refresh", async ({
      page,
      auth,
      payment,
    }) => {
      await auth.loginAsUser(page, "free");

      // Complete upgrade
      await payment.navigateToUpgrade(page, "pro");
      await page
        .locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]')
        .click();
      await page.waitForURL("**/checkout.stripe.com/**");
      await payment.fillStripeCheckout(page);
      await payment.completeStripePayment(page);
      await payment.waitForStripeRedirect(page);

      // Refresh page
      await page.reload();

      // Should still show pro plan
      await payment.verifySubscription(page, "Pro", 50);
    });

    test("should handle network interruption during upgrade", async ({
      page,
      auth,
      payment,
      context,
    }) => {
      await auth.loginAsUser(page, "free");
      await payment.navigateToUpgrade(page, "pro");

      // Start upgrade
      await page
        .locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]')
        .click();
      await page.waitForURL("**/checkout.stripe.com/**");

      // Simulate network interruption
      await context.setOffline(true);

      // Try to complete payment
      await payment.fillStripeCheckout(page);

      // Should show error
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
      await stripeFrame.locator('button[type="submit"]').click();

      // Re-enable network
      await context.setOffline(false);

      // Should be able to retry
      await stripeFrame.locator('button[type="submit"]').click();
      await payment.waitForStripeRedirect(page);

      // Verify upgrade completed
      await payment.verifySubscription(page, "Pro", 50);
    });
  });
});
