/**
 * Custom Cypress commands for PrecisionPDF testing
 */

/// <reference types="cypress" />

// Type definitions for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Sign in to the application using Clerk
       * @param email - User email
       * @param password - User password
       */
      signIn(email: string, password: string): Chainable<void>;

      /**
       * Sign out of the application
       */
      signOut(): Chainable<void>;

      /**
       * Wait for Convex to be ready
       */
      waitForConvex(): Chainable<void>;

      /**
       * Upload a file using the file uploader
       * @param fileName - Name of the file in fixtures folder
       * @param mimeType - MIME type of the file
       */
      uploadFile(fileName: string, mimeType?: string): Chainable<void>;

      /**
       * Select text chunks in the document viewer
       * @param chunkIndices - Array of chunk indices to select
       */
      selectChunks(chunkIndices: number[]): Chainable<void>;

      /**
       * Wait for document processing to complete
       * @param timeout - Maximum time to wait in milliseconds
       */
      waitForProcessing(timeout?: number): Chainable<void>;

      /**
       * Clear all test data (documents, etc.)
       */
      clearTestData(): Chainable<void>;

      /**
       * Mock Stripe payment elements
       */
      mockStripeElements(): Chainable<void>;

      /**
       * Fill Stripe card details
       * @param cardNumber - Test card number
       * @param expiry - Card expiry (MM/YY)
       * @param cvc - Card CVC
       * @param zip - Billing ZIP code
       */
      fillStripeCard(
        cardNumber?: string,
        expiry?: string,
        cvc?: string,
        zip?: string
      ): Chainable<void>;
    }
  }
}

// Sign in command
Cypress.Commands.add('signIn', (email: string, password: string) => {
  cy.visit('/');
  cy.get('[data-clerk-sign-in]').click();
  cy.get('input[name="identifier"]').type(email);
  cy.get('button[type="submit"]').click();
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', 'sign-in');
});

// Sign out command
Cypress.Commands.add('signOut', () => {
  cy.get('[data-clerk-user-button]').click();
  cy.get('[data-clerk-sign-out]').click();
  cy.url().should('eq', Cypress.config('baseUrl') + '/');
});

// Wait for Convex
Cypress.Commands.add('waitForConvex', () => {
  cy.window().should('have.property', '__convex_client__');
  cy.wait(1000); // Give Convex time to initialize
});

// Upload file
Cypress.Commands.add('uploadFile', (fileName: string, mimeType = 'application/pdf') => {
  cy.fixture(fileName, 'base64').then((fileContent) => {
    const blob = Cypress.Blob.base64StringToBlob(fileContent, mimeType);
    const file = new File([blob], fileName, { type: mimeType });
    
    cy.get('input[type="file"]').then((input) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      (input[0] as HTMLInputElement).files = dataTransfer.files;
      cy.wrap(input).trigger('change', { force: true });
    });
  });
});

// Select chunks
Cypress.Commands.add('selectChunks', (chunkIndices: number[]) => {
  chunkIndices.forEach((index) => {
    cy.get(`[data-chunk-index="${index}"]`).click();
  });
});

// Wait for processing
Cypress.Commands.add('waitForProcessing', (timeout = 60000) => {
  cy.get('[data-processing-status="completed"]', { timeout }).should('exist');
});

// Clear test data
Cypress.Commands.add('clearTestData', () => {
  // This would typically call a test-only API endpoint
  // For now, we'll just navigate to documents and delete them manually
  cy.visit('/documents');
  cy.get('body').then(($body) => {
    if ($body.find('[data-document-item]').length > 0) {
      cy.get('[data-document-item]').each(($el) => {
        cy.wrap($el).find('[data-delete-button]').click();
        cy.get('[data-confirm-delete]').click();
      });
    }
  });
});

// Mock Stripe Elements
Cypress.Commands.add('mockStripeElements', () => {
  cy.window().then((win) => {
    // Check if we're in test mode
    if ((win as any).Stripe) {
      // Stripe is already loaded, we're using real Stripe in test mode
      return;
    }
  });
});

// Fill Stripe card
Cypress.Commands.add('fillStripeCard', (
  cardNumber = '4242424242424242',
  expiry = '12/30',
  cvc = '123',
  zip = '12345'
) => {
  // Wait for Stripe iframe to load
  cy.get('iframe[name*="stripe"]').should('exist');
  
  // For real Stripe Elements in test mode
  cy.get('iframe[title*="Secure card number"]').then(($iframe) => {
    const body = $iframe.contents().find('body');
    cy.wrap(body).find('input[name="cardnumber"]').type(cardNumber);
  });
  
  cy.get('iframe[title*="Secure expiration date"]').then(($iframe) => {
    const body = $iframe.contents().find('body');
    cy.wrap(body).find('input[name="exp-date"]').type(expiry);
  });
  
  cy.get('iframe[title*="Secure CVC"]').then(($iframe) => {
    const body = $iframe.contents().find('body');
    cy.wrap(body).find('input[name="cvc"]').type(cvc);
  });
  
  // ZIP might be outside iframe
  cy.get('input[name="postalCode"]').type(zip);
});

// Export empty object to make this a module
export {};