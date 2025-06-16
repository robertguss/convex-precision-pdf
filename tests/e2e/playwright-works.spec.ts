import { test, expect } from '@playwright/test';

test('playwright is working', async ({ page }) => {
  // Just go to a public website to verify Playwright works
  await page.goto('https://playwright.dev');
  await expect(page).toHaveTitle(/Playwright/);
});