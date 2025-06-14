/**
 * Fixtures manager for handling test files and data
 */

import { TestDocument } from './test-data';

export class FixturesManager {
  /**
   * Generate a test PDF file
   * This creates a simple PDF for testing purposes
   */
  static generateTestPDF(pages: number = 1): Blob {
    // This is a simplified version - in real tests, you'd have actual PDF files
    // For now, we'll create a basic text file that simulates a PDF
    const content = Array(pages)
      .fill(null)
      .map((_, i) => `Page ${i + 1} content\nThis is test content for page ${i + 1}.`)
      .join('\n\n');
    
    return new Blob([content], { type: 'application/pdf' });
  }

  /**
   * Load a fixture file
   */
  static loadFixture(fileName: string): Cypress.Chainable<any> {
    return cy.fixture(fileName);
  }

  /**
   * Create test PDF fixtures if they don't exist
   */
  static ensureTestPDFs(): void {
    const testPDFs = [
      { name: 'test-small.pdf', pages: 2 },
      { name: 'test-medium.pdf', pages: 10 },
      { name: 'test-large.pdf', pages: 50 },
    ];

    // Note: In a real implementation, you'd create actual PDF files
    // For testing, we'll assume these files exist in cypress/fixtures
  }

  /**
   * Generate test data for a document
   */
  static generateDocumentData(doc: TestDocument): any {
    return {
      title: doc.title,
      fileName: doc.fileName,
      pages: doc.pages,
      chunks: doc.chunks,
      status: 'pending',
      uploadedAt: new Date().toISOString(),
      processingMetadata: {
        startTime: null,
        endTime: null,
        duration: null,
      },
    };
  }

  /**
   * Create a multi-file upload scenario
   */
  static createMultiFileUpload(fileCount: number = 3): File[] {
    return Array(fileCount)
      .fill(null)
      .map((_, i) => {
        const blob = this.generateTestPDF(i + 1);
        return new File([blob], `test-file-${i + 1}.pdf`, { type: 'application/pdf' });
      });
  }
}

/**
 * State management for tests
 */
export class TestStateManager {
  private static state: Map<string, any> = new Map();

  /**
   * Store a value for later use in the test
   */
  static set(key: string, value: any): void {
    this.state.set(key, value);
  }

  /**
   * Retrieve a stored value
   */
  static get(key: string): any {
    return this.state.get(key);
  }

  /**
   * Clear all stored state
   */
  static clear(): void {
    this.state.clear();
  }

  /**
   * Store current user context
   */
  static setCurrentUser(user: { id: string; email: string; plan: string }): void {
    this.set('currentUser', user);
  }

  /**
   * Get current user context
   */
  static getCurrentUser(): any {
    return this.get('currentUser');
  }

  /**
   * Store document upload result
   */
  static setLastUploadedDocument(doc: { id: string; title: string; status: string }): void {
    this.set('lastDocument', doc);
  }

  /**
   * Get last uploaded document
   */
  static getLastUploadedDocument(): any {
    return this.get('lastDocument');
  }
}

/**
 * API mocking utilities (if needed for unit tests)
 */
export class APIMocker {
  /**
   * Mock Convex API responses
   */
  static mockConvexQuery(functionName: string, response: any): void {
    cy.intercept('POST', '**/api/convex/**', (req) => {
      if (req.body.path === functionName) {
        req.reply({
          statusCode: 200,
          body: { result: response },
        });
      }
    });
  }

  /**
   * Mock FastAPI responses
   */
  static mockFastAPIEndpoint(endpoint: string, response: any): void {
    cy.intercept('POST', `**/api/${endpoint}`, {
      statusCode: 200,
      body: response,
    });
  }

  /**
   * Mock Stripe API responses
   */
  static mockStripeResponse(action: string, response: any): void {
    cy.intercept('POST', 'https://api.stripe.com/**', (req) => {
      if (req.url.includes(action)) {
        req.reply({
          statusCode: 200,
          body: response,
        });
      }
    });
  }
}

/**
 * Environment setup utilities
 */
export class EnvironmentSetup {
  /**
   * Setup test environment variables
   */
  static setupTestEnv(): void {
    // Set any necessary environment variables for tests
    Cypress.env('TEST_MODE', true);
    Cypress.env('SKIP_ANALYTICS', true);
  }

  /**
   * Reset environment after tests
   */
  static resetEnv(): void {
    Cypress.env('TEST_MODE', false);
    Cypress.env('SKIP_ANALYTICS', false);
  }
}