/**
 * Custom test fixtures for PrecisionPDF tests
 * Extends Playwright's base test with custom functionality
 */

import { test as base } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import * as authHelpers from '../helpers/auth.helper';
import * as paymentHelpers from '../helpers/payment.helper';
import * as documentHelpers from '../helpers/document.helper';
import * as databaseHelpers from '../helpers/database.helper';

// Define custom fixtures
type TestFixtures = {
  authenticatedPage: any;
  testUser: authHelpers.TestUser;
};

// Extend base test with our fixtures
export const test = base.extend<TestFixtures>({
  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Setup Clerk testing token
    await setupClerkTestingToken({ page });
    
    // Use the page
    await use(page);
  },
  
  // Test user fixture
  testUser: async ({}, use) => {
    // Default to free tier user
    await use(authHelpers.testUsers.free);
  },
});

// Re-export expect
export { expect } from '@playwright/test';

// Export all helpers for convenience
export const auth = authHelpers;
export const payment = paymentHelpers;
export const document = documentHelpers;
export const database = databaseHelpers;