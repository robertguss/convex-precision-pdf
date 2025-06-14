/**
 * Test data management utilities for Cypress tests
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
  plan: 'free' | 'pro' | 'business';
}

export interface TestDocument {
  fileName: string;
  title: string;
  pages: number;
  chunks: number;
}

export interface TestSubscription {
  planId: string;
  priceId: string;
  credits: number;
  stripeCustomerId?: string;
}

/**
 * Test users with different subscription levels
 */
export const testUsers: Record<string, TestUser> = {
  freeUser: {
    email: 'free.user@test.precisionpdf.com',
    password: 'TestPassword123!',
    name: 'Free Test User',
    plan: 'free',
  },
  proUser: {
    email: 'pro.user@test.precisionpdf.com',
    password: 'TestPassword123!',
    name: 'Pro Test User',
    plan: 'pro',
  },
  businessUser: {
    email: 'business.user@test.precisionpdf.com',
    password: 'TestPassword123!',
    name: 'Business Test User',
    plan: 'business',
  },
};

/**
 * Test documents for upload testing
 */
export const testDocuments: Record<string, TestDocument> = {
  smallPdf: {
    fileName: 'test-small.pdf',
    title: 'Small Test Document',
    pages: 2,
    chunks: 5,
  },
  mediumPdf: {
    fileName: 'test-medium.pdf',
    title: 'Medium Test Document',
    pages: 10,
    chunks: 25,
  },
  largePdf: {
    fileName: 'test-large.pdf',
    title: 'Large Test Document',
    pages: 50,
    chunks: 125,
  },
};

/**
 * Test credit card numbers (Stripe test cards)
 */
export const testCards = {
  valid: {
    number: '4242424242424242',
    expiry: '12/30',
    cvc: '123',
    zip: '12345',
  },
  declined: {
    number: '4000000000000002',
    expiry: '12/30',
    cvc: '123',
    zip: '12345',
  },
  insufficientFunds: {
    number: '4000000000009995',
    expiry: '12/30',
    cvc: '123',
    zip: '12345',
  },
  expired: {
    number: '4000000000000069',
    expiry: '12/30',
    cvc: '123',
    zip: '12345',
  },
};

/**
 * Subscription plan details
 */
export const subscriptionPlans = {
  free: {
    planId: 'free',
    priceId: '',
    credits: 3,
    features: ['3 free conversions', 'Basic export formats'],
  },
  pro: {
    planId: 'pro',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_test_pro',
    credits: 50,
    features: ['50 conversions/month', 'All export formats', 'Priority processing'],
  },
  business: {
    planId: 'business',
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || 'price_test_business',
    credits: 200,
    features: ['200 conversions/month', 'All export formats', 'Priority support', 'API access'],
  },
};

/**
 * Helper to generate unique test data
 */
export class TestDataGenerator {
  private static counter = 0;

  static generateUniqueEmail(prefix: string = 'test'): string {
    const timestamp = Date.now();
    const count = ++this.counter;
    return `${prefix}.${timestamp}.${count}@test.precisionpdf.com`;
  }

  static generateUniqueFileName(extension: string = 'pdf'): string {
    const timestamp = Date.now();
    const count = ++this.counter;
    return `test-file-${timestamp}-${count}.${extension}`;
  }

  static generateTestUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      email: this.generateUniqueEmail(),
      password: 'TestPassword123!',
      name: 'Test User',
      plan: 'free',
      ...overrides,
    };
  }
}

/**
 * Test data cleanup utilities
 */
export class TestDataCleanup {
  static async cleanupUser(email: string): Promise<void> {
    // This would typically call a test-only API endpoint
    // to clean up user data from Clerk and Convex
    console.log(`Would cleanup user: ${email}`);
  }

  static async cleanupAllTestUsers(): Promise<void> {
    // Cleanup all test users created during tests
    const testEmailPattern = /@test\.precisionpdf\.com$/;
    console.log('Would cleanup all test users');
  }

  static async cleanupDocuments(userId: string): Promise<void> {
    // Cleanup all documents for a specific user
    console.log(`Would cleanup documents for user: ${userId}`);
  }
}

/**
 * Wait utilities for common operations
 */
export const waitFor = {
  documentProcessing: (timeout = 60000) => {
    return cy.get('[data-processing-status="completed"]', { timeout });
  },
  
  stripeElement: (timeout = 10000) => {
    return cy.get('iframe[name*="stripe"]', { timeout });
  },
  
  convexSync: (timeout = 5000) => {
    return cy.wait(1000); // Simple wait for Convex to sync
  },
  
  pageLoad: (timeout = 30000) => {
    return cy.get('body', { timeout }).should('not.have.class', 'loading');
  },
};

/**
 * Assertion helpers
 */
export const assertThat = {
  userIsSignedIn: () => {
    cy.get('[data-clerk-user-button]').should('exist');
    cy.url().should('not.include', 'sign-in');
  },
  
  userIsSignedOut: () => {
    cy.get('[data-clerk-user-button]').should('not.exist');
  },
  
  documentIsUploaded: (title: string) => {
    cy.contains('[data-document-title]', title).should('exist');
  },
  
  creditBalanceIs: (credits: number) => {
    cy.get('[data-credit-balance]').should('contain', credits.toString());
  },
  
  subscriptionPlanIs: (plan: 'free' | 'pro' | 'business') => {
    cy.get('[data-subscription-plan]').should('contain', plan);
  },
};