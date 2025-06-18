/**
 * Subscription E2E Tests Entry Point
 * Sets up common configuration for all subscription-related tests
 */

import { test } from "@playwright/test";
import { resetDatabase, seedTestUsers } from "../../helpers/database.helper";

// Configure Stripe test mode environment
test.beforeAll(async () => {
  // Ensure we're using Stripe test mode
  if (!process.env.STRIPE_SECRET_KEY?.includes("sk_test_")) {
    throw new Error("Stripe test mode required for E2E tests");
  }

  console.log("✓ Stripe test mode confirmed");
});

// Reset database before each test
test.beforeEach(async ({ page }) => {
  // Reset to clean state
  await resetDatabase();
  await seedTestUsers();

  // Set up request interception for webhooks
  await page.route("/api/webhooks/stripe", async (route) => {
    // Log webhook calls for debugging
    const request = route.request();
    console.log("Stripe webhook intercepted:", await request.postDataJSON());

    // Continue with the request
    await route.continue();
  });
});

// Clean up after all tests
test.afterAll(async () => {
  console.log("✓ Subscription tests completed");
});

// Export test configuration
export const subscriptionTestConfig = {
  stripeTestMode: true,
  defaultTimeout: 30000,
  webhookTimeout: 5000,
};
