/**
 * Example test demonstrating how to use all the helper functions
 */

import { test, expect, auth, payment, document, database } from '../fixtures/test-fixtures';

test.describe('Example Tests with Helpers', () => {
  // Reset database before each test
  test.beforeEach(async () => {
    await database.resetDatabase();
    await database.seedTestUsers();
  });
  
  test('complete user journey - free to pro with document processing', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Step 1: Sign in as free user
    await auth.signIn(page, auth.testUsers.free.email, auth.testUsers.free.password);
    
    // Step 2: Verify free tier limits
    await payment.verifySubscription(page, 'Free', 3);
    
    // Step 3: Upload a document
    await page.goto('/documents');
    await document.uploadFile(page, 'test-small.pdf');
    
    // Step 4: Wait for processing
    await document.waitForProcessing(page);
    
    // Step 5: Select some chunks
    await document.selectChunks(page, [0, 1, 2]);
    
    // Step 6: Try to export (should prompt for upgrade)
    await page.locator('[data-cy="export-button"]').click();
    await expect(page.locator('[data-cy="upgrade-prompt"]')).toBeVisible();
    
    // Step 7: Navigate to upgrade
    await payment.navigateToUpgrade(page, 'pro');
    
    // Step 8: Complete payment
    await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
    await payment.fillStripeCheckout(page);
    await payment.completeStripePayment(page);
    await payment.waitForStripeRedirect(page);
    
    // Step 9: Verify upgraded subscription
    await payment.verifySubscription(page, 'Pro', 50);
    
    // Step 10: Export document successfully
    await page.goto('/documents');
    const download = await document.exportChunks(page, 'txt');
    expect(download).toBeTruthy();
  });
  
  test('payment failure handling', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Sign in as free user
    await auth.loginAsUser(page, 'free');
    
    // Try to upgrade with declining card
    await payment.navigateToUpgrade(page, 'pro');
    await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
    
    // Use declining card
    await payment.simulatePaymentFailure(page);
    
    // Verify error message
    await expect(page.locator('[data-cy="payment-error"]')).toBeVisible();
    
    // Verify still on free plan
    await page.goto('/dashboard');
    await payment.verifySubscription(page, 'Free', 3);
  });
  
  test('document management', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Sign in as pro user
    await auth.loginAsUser(page, 'pro');
    
    // Create test documents
    await database.createTestDocuments(auth.testUsers.pro.id, 3);
    
    // Navigate to documents
    await page.goto('/documents');
    
    // Verify documents are listed
    await expect(page.locator('[data-cy="document-card"]')).toHaveCount(3);
    
    // Search for a document
    await document.searchInDocument(page, 'Test Document 1');
    
    // Delete a document
    await document.deleteDocument(page);
    
    // Verify document count
    await page.goto('/documents');
    await expect(page.locator('[data-cy="document-card"]')).toHaveCount(2);
  });
});