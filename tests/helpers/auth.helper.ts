/**
 * Authentication helper functions for Playwright tests
 * Handles Clerk authentication flows and user session management
 */

import { Page, BrowserContext } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import path from 'path';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  clerkId: string;
  tier: 'free' | 'pro' | 'business';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// Test user data matching Cypress setup
export const testUsers: Record<string, TestUser> = {
  free: {
    id: 'test-user-free',
    email: 'free.user@test.precisionpdf.com',
    password: 'TestPassword123!',
    name: 'Free Test User',
    clerkId: 'user_test_free',
    tier: 'free',
  },
  pro: {
    id: 'test-user-pro',
    email: 'pro.user@test.precisionpdf.com',
    password: 'TestPassword123!',
    name: 'Pro Test User',
    clerkId: 'user_test_pro',
    tier: 'pro',
    stripeCustomerId: 'cus_test_pro',
    stripeSubscriptionId: 'sub_test_pro',
  },
  business: {
    id: 'test-user-business',
    email: 'business.user@test.precisionpdf.com',
    password: 'TestPassword123!',
    name: 'Business Test User',
    clerkId: 'user_test_business',
    tier: 'business',
    stripeCustomerId: 'cus_test_business',
    stripeSubscriptionId: 'sub_test_business',
  },
};

/**
 * Sign in to the application using Clerk
 */
export async function signIn(page: Page, email: string, password: string) {
  // Setup Clerk testing token for this page
  await setupClerkTestingToken({ page });
  
  // Navigate to the home page
  await page.goto('/');
  
  // Click the sign-in button to open the modal
  await page.locator('button:has-text("Sign in")').first().click();
  
  // Wait for the Clerk modal to appear
  await page.waitForSelector('[data-clerk-portal-root]', { timeout: 5000 });
  
  // Fill in email/username in the Clerk modal
  const emailInput = page.locator('[data-clerk-portal-root] input[name="identifier"]');
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill(email);
  await page.locator('[data-clerk-portal-root] button:has-text("Continue")').click();
  
  // Wait for password field to appear and fill it
  const passwordInput = page.locator('[data-clerk-portal-root] input[name="password"]');
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.fill(password);
  await page.locator('[data-clerk-portal-root] button:has-text("Continue")').click();
  
  // Wait for sign-in to complete
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  
  // Wait for Convex to be ready
  await waitForConvex(page);
}

/**
 * Sign in as a specific test user tier
 */
export async function loginAsUser(page: Page, tier: 'free' | 'pro' | 'business') {
  const user = testUsers[tier];
  await signIn(page, user.email, user.password);
}

/**
 * Sign out of the application
 */
export async function signOut(page: Page) {
  // Click user menu
  await page.locator('[data-cy="user-menu"]').click();
  
  // Click sign out
  await page.locator('[data-cy="sign-out-button"]').click();
  
  // Wait for redirect to home page
  await page.waitForURL('/');
}

/**
 * Wait for Convex to be ready
 */
export async function waitForConvex(page: Page) {
  // Wait for Convex connection indicator or data to load
  await page.waitForFunction(
    () => {
      // Check if Convex client is connected
      return window.__convex?.connectionState === 'connected';
    },
    { timeout: 10000 }
  );
}

/**
 * Get or create authenticated browser context
 * This allows reusing authentication state across tests
 */
export async function getAuthenticatedContext(
  browser: any,
  tier: 'free' | 'pro' | 'business'
): Promise<BrowserContext> {
  const storageStatePath = path.join(
    process.cwd(),
    'tests',
    '.auth',
    `${tier}-user.json`
  );
  
  try {
    // Try to load existing auth state
    const context = await browser.newContext({
      storageState: storageStatePath,
    });
    
    // Verify the auth state is still valid
    const page = await context.newPage();
    await page.goto('/dashboard');
    
    // If we can access dashboard, auth is valid
    if (page.url().includes('/dashboard')) {
      await page.close();
      return context;
    }
    
    // Otherwise, re-authenticate
    await page.close();
    await context.close();
  } catch (e) {
    // Auth state doesn't exist or is invalid
  }
  
  // Create new authenticated context
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Sign in
  await loginAsUser(page, tier);
  
  // Save auth state
  await context.storageState({ path: storageStatePath });
  
  await page.close();
  return context;
}

/**
 * Verify user is authenticated and on the correct page
 */
export async function verifyAuthenticated(page: Page) {
  // Check we're not on the sign-in page
  expect(page.url()).not.toContain('/sign-in');
  
  // Check user menu is visible
  await expect(page.locator('[data-cy="user-menu"]')).toBeVisible();
}

// Re-export expect for convenience
export { expect } from '@playwright/test';