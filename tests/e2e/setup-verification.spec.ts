import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

test.describe('Playwright Setup Verification', () => {
  test('should load the home page', async ({ page }) => {
    // Setup Clerk testing token
    await setupClerkTestingToken({ page });
    
    // Navigate to the home page
    await page.goto('/');
    
    // Verify the page loads
    await expect(page).toHaveTitle(/PrecisionPDF/);
    
    // Check if the main content is visible
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('can navigate between pages', async ({ page }) => {
    await setupClerkTestingToken({ page });
    
    // Navigate to home
    await page.goto('/');
    
    // Navigate to pricing
    await page.locator('a[href="/pricing"]').click();
    await expect(page).toHaveURL(/.*pricing/);
    
    // Verify pricing page content
    await expect(page.locator('h1')).toContainText(/Pricing/i);
  });

  test('helper functions are available', async ({ page }) => {
    // Test that our custom helpers can be imported
    const { signIn, testUsers } = await import('../helpers/auth.helper');
    const { navigateToUpgrade } = await import('../helpers/payment.helper');
    const { uploadFile } = await import('../helpers/document.helper');
    const { resetDatabase } = await import('../helpers/database.helper');
    
    // Verify helpers are functions
    expect(typeof signIn).toBe('function');
    expect(typeof navigateToUpgrade).toBe('function');
    expect(typeof uploadFile).toBe('function');
    expect(typeof resetDatabase).toBe('function');
    
    // Verify test data is available
    expect(testUsers.free).toBeDefined();
    expect(testUsers.pro).toBeDefined();
    expect(testUsers.business).toBeDefined();
  });

  test('TypeScript types are working correctly', async ({ page }) => {
    // This test verifies TypeScript compilation
    const testUser: { email: string; tier: 'free' | 'pro' | 'business' } = {
      email: 'test@example.com',
      tier: 'free'
    };
    
    expect(testUser.email).toBe('test@example.com');
    expect(testUser.tier).toBe('free');
  });
});