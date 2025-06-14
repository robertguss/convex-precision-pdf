/**
 * Setup verification test
 * This test verifies that Cypress is properly configured
 */

import { HomePage } from '../support/page-objects';
import { testUsers, assertThat } from '../support/test-data';

describe('Cypress Setup Verification', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('/');
  });

  it('should load the home page', () => {
    // Verify the page loads
    cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
    
    // Check for basic elements
    cy.get('body').should('be.visible');
    
    // Check for navigation
    cy.get('nav').should('be.visible');
  });

  it('should navigate between pages', () => {
    const homePage = new HomePage();
    homePage.visit();
    
    // Navigate to pricing page
    homePage.getNavigation().pricingLink().click();
    cy.url().should('include', '/pricing');
    
    // Navigate back home
    homePage.getNavigation().homeLink().click();
    cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
  });

  it('should verify custom commands are available', () => {
    // Verify waitForConvex command exists
    cy.waitForConvex();
    
    // Verify other custom commands are registered
    expect(cy.signIn).to.be.a('function');
    expect(cy.signOut).to.be.a('function');
    expect(cy.uploadFile).to.be.a('function');
    expect(cy.selectChunks).to.be.a('function');
    expect(cy.waitForProcessing).to.be.a('function');
    expect(cy.clearTestData).to.be.a('function');
    expect(cy.mockStripeElements).to.be.a('function');
    expect(cy.fillStripeCard).to.be.a('function');
  });

  it('should handle viewport resizing', () => {
    // Test desktop viewport
    cy.viewport(1280, 720);
    cy.wait(500);
    
    // Test tablet viewport
    cy.viewport(768, 1024);
    cy.wait(500);
    
    // Test mobile viewport
    cy.viewport(375, 667);
    cy.wait(500);
    
    // Return to default
    cy.viewport(1280, 720);
  });

  it('should verify page objects work correctly', () => {
    const homePage = new HomePage();
    
    // Visit home page using page object
    homePage.visit();
    
    // Verify URL helper
    expect(homePage.getUrl()).to.equal('/');
    
    // Check if authentication check works
    homePage.isAuthenticated().then((isAuth) => {
      // User should not be authenticated on first visit
      expect(isAuth).to.be.false;
    });
  });

  it('should verify test data utilities are accessible', () => {
    // Verify test users are defined
    expect(testUsers.freeUser).to.have.property('email');
    expect(testUsers.proUser).to.have.property('email');
    expect(testUsers.businessUser).to.have.property('email');
    
    // Verify assertion helpers work
    assertThat.userIsSignedOut();
  });

  it('should handle errors gracefully', () => {
    // Test error handling with invalid navigation
    cy.visit('/non-existent-page', { failOnStatusCode: false });
    
    // Should show 404 or redirect
    cy.url().should('exist');
  });

  it('should verify Cypress configuration', () => {
    // Verify base URL is set correctly
    expect(Cypress.config('baseUrl')).to.equal('http://localhost:3000');
    
    // Verify viewport settings
    expect(Cypress.config('viewportWidth')).to.equal(1280);
    expect(Cypress.config('viewportHeight')).to.equal(720);
    
    // Verify timeouts
    expect(Cypress.config('defaultCommandTimeout')).to.equal(10000);
    expect(Cypress.config('requestTimeout')).to.equal(10000);
  });
});

describe('Cypress TypeScript Support', () => {
  it('should support TypeScript types', () => {
    // Test type checking is working
    const testString: string = 'Hello Cypress';
    const testNumber: number = 42;
    const testBoolean: boolean = true;
    
    expect(testString).to.be.a('string');
    expect(testNumber).to.be.a('number');
    expect(testBoolean).to.be.a('boolean');
  });

  it('should support async/await syntax', async () => {
    // Cypress commands return chainables, not promises
    // But we can still use async patterns in certain contexts
    const result = await new Promise<string>((resolve) => {
      setTimeout(() => resolve('async test'), 100);
    });
    
    expect(result).to.equal('async test');
  });
});