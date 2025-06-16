import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  // Just check we can navigate
  expect(page.url()).toContain('localhost:3000');
});