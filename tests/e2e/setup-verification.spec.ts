import { test, expect } from '@playwright/test';

test.describe('Playwright Setup Verification', () => {
  test('should load the home page', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Verify the page title or a key element
    await expect(page).toHaveTitle(/PrecisionPDF/);
    
    // Check if the main content is visible
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});