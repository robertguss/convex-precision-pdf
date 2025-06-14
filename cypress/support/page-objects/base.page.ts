/**
 * Base page object with common functionality
 */

export abstract class BasePage {
  /**
   * Visit the page
   */
  abstract visit(): void;

  /**
   * Get the page URL
   */
  abstract getUrl(): string;

  /**
   * Wait for page to load
   */
  waitForPageLoad(): void {
    cy.get('body').should('not.have.class', 'loading');
    cy.waitForConvex();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): Cypress.Chainable<boolean> {
    return cy.get('body').then(($body) => {
      return $body.find('[data-clerk-user-button]').length > 0;
    });
  }

  /**
   * Get navigation elements
   */
  getNavigation() {
    return {
      logo: () => cy.get('[data-nav-logo]'),
      homeLink: () => cy.get('[data-nav-home]'),
      documentsLink: () => cy.get('[data-nav-documents]'),
      pricingLink: () => cy.get('[data-nav-pricing]'),
      userButton: () => cy.get('[data-clerk-user-button]'),
      signInButton: () => cy.get('[data-clerk-sign-in]'),
    };
  }

  /**
   * Get common UI elements
   */
  getCommonElements() {
    return {
      loadingSpinner: () => cy.get('[data-loading-spinner]'),
      errorMessage: () => cy.get('[data-error-message]'),
      successMessage: () => cy.get('[data-success-message]'),
      modal: () => cy.get('[data-modal]'),
      modalClose: () => cy.get('[data-modal-close]'),
    };
  }

  /**
   * Handle common error scenarios
   */
  handleError(action: () => void): void {
    cy.on('fail', (err) => {
      // Log the error for debugging
      console.error('Test failed with error:', err.message);
      
      // Take a screenshot
      cy.screenshot(`error-${Date.now()}`);
      
      // Re-throw to fail the test
      throw err;
    });
    
    action();
  }
}

/**
 * Page object for the home/landing page
 */
export class HomePage extends BasePage {
  visit(): void {
    cy.visit('/');
    this.waitForPageLoad();
  }

  getUrl(): string {
    return '/';
  }

  getHeroSection() {
    return {
      heading: () => cy.get('[data-hero-heading]'),
      subheading: () => cy.get('[data-hero-subheading]'),
      ctaButton: () => cy.get('[data-hero-cta]'),
      demoButton: () => cy.get('[data-hero-demo]'),
    };
  }

  getFeaturesSection() {
    return {
      container: () => cy.get('[data-features-section]'),
      featureCards: () => cy.get('[data-feature-card]'),
      featureTitle: (index: number) => cy.get(`[data-feature-card]:nth-child(${index + 1}) [data-feature-title]`),
      featureDescription: (index: number) => cy.get(`[data-feature-card]:nth-child(${index + 1}) [data-feature-description]`),
    };
  }

  clickGetStarted(): void {
    this.getHeroSection().ctaButton().click();
  }
}

/**
 * Page object for the documents page
 */
export class DocumentsPage extends BasePage {
  visit(): void {
    cy.visit('/documents');
    this.waitForPageLoad();
  }

  getUrl(): string {
    return '/documents';
  }

  getUploadSection() {
    return {
      dropzone: () => cy.get('[data-upload-dropzone]'),
      fileInput: () => cy.get('input[type="file"]'),
      uploadButton: () => cy.get('[data-upload-button]'),
      uploadProgress: () => cy.get('[data-upload-progress]'),
    };
  }

  getDocumentsList() {
    return {
      container: () => cy.get('[data-documents-list]'),
      documentItems: () => cy.get('[data-document-item]'),
      documentTitle: (index: number) => cy.get(`[data-document-item]:nth-child(${index + 1}) [data-document-title]`),
      documentStatus: (index: number) => cy.get(`[data-document-item]:nth-child(${index + 1}) [data-document-status]`),
      viewButton: (index: number) => cy.get(`[data-document-item]:nth-child(${index + 1}) [data-view-button]`),
      deleteButton: (index: number) => cy.get(`[data-document-item]:nth-child(${index + 1}) [data-delete-button]`),
    };
  }

  getCreditDisplay() {
    return {
      balance: () => cy.get('[data-credit-balance]'),
      warning: () => cy.get('[data-credit-warning]'),
      upgradePrompt: () => cy.get('[data-upgrade-prompt]'),
    };
  }

  uploadFile(fileName: string): void {
    cy.uploadFile(fileName);
  }

  deleteDocument(index: number): void {
    this.getDocumentsList().deleteButton(index).click();
    cy.get('[data-confirm-delete]').click();
  }

  waitForDocument(title: string): void {
    cy.contains('[data-document-title]', title).should('exist');
  }
}

/**
 * Page object for the document viewer
 */
export class DocumentViewerPage extends BasePage {
  constructor(private documentId: string) {
    super();
  }

  visit(): void {
    cy.visit(`/documents/${this.documentId}`);
    this.waitForPageLoad();
  }

  getUrl(): string {
    return `/documents/${this.documentId}`;
  }

  getViewer() {
    return {
      container: () => cy.get('[data-document-viewer]'),
      canvas: () => cy.get('[data-pdf-canvas]'),
      pageNavigation: () => cy.get('[data-page-navigation]'),
      currentPage: () => cy.get('[data-current-page]'),
      totalPages: () => cy.get('[data-total-pages]'),
      previousButton: () => cy.get('[data-page-previous]'),
      nextButton: () => cy.get('[data-page-next]'),
      zoomIn: () => cy.get('[data-zoom-in]'),
      zoomOut: () => cy.get('[data-zoom-out]'),
      zoomReset: () => cy.get('[data-zoom-reset]'),
    };
  }

  getChunkSelector() {
    return {
      container: () => cy.get('[data-chunk-selector]'),
      chunks: () => cy.get('[data-chunk]'),
      chunk: (index: number) => cy.get(`[data-chunk-index="${index}"]`),
      selectedChunks: () => cy.get('[data-chunk][data-selected="true"]'),
      selectAllButton: () => cy.get('[data-select-all-chunks]'),
      clearSelectionButton: () => cy.get('[data-clear-chunk-selection]'),
    };
  }

  getExportSection() {
    return {
      container: () => cy.get('[data-export-section]'),
      formatSelector: () => cy.get('[data-export-format-selector]'),
      exportButton: () => cy.get('[data-export-button]'),
      downloadLink: () => cy.get('[data-download-link]'),
    };
  }

  navigateToPage(pageNumber: number): void {
    const viewer = this.getViewer();
    viewer.currentPage().clear().type(pageNumber.toString());
    viewer.currentPage().type('{enter}');
  }

  selectChunks(indices: number[]): void {
    cy.selectChunks(indices);
  }

  exportDocument(format: string): void {
    this.getExportSection().formatSelector().select(format);
    this.getExportSection().exportButton().click();
  }
}

/**
 * Page object for the pricing page
 */
export class PricingPage extends BasePage {
  visit(): void {
    cy.visit('/pricing');
    this.waitForPageLoad();
  }

  getUrl(): string {
    return '/pricing';
  }

  getPricingCards() {
    return {
      container: () => cy.get('[data-pricing-cards]'),
      freeCard: () => cy.get('[data-pricing-card="free"]'),
      proCard: () => cy.get('[data-pricing-card="pro"]'),
      businessCard: () => cy.get('[data-pricing-card="business"]'),
      cardTitle: (plan: string) => cy.get(`[data-pricing-card="${plan}"] [data-card-title]`),
      cardPrice: (plan: string) => cy.get(`[data-pricing-card="${plan}"] [data-card-price]`),
      cardFeatures: (plan: string) => cy.get(`[data-pricing-card="${plan}"] [data-card-features] li`),
      cardButton: (plan: string) => cy.get(`[data-pricing-card="${plan}"] [data-card-button]`),
    };
  }

  selectPlan(plan: 'free' | 'pro' | 'business'): void {
    this.getPricingCards().cardButton(plan).click();
  }
}

/**
 * Page object for the checkout/payment page
 */
export class CheckoutPage extends BasePage {
  visit(): void {
    // Checkout is typically accessed via plan selection
    cy.visit('/checkout');
    this.waitForPageLoad();
  }

  getUrl(): string {
    return '/checkout';
  }

  getCheckoutForm() {
    return {
      container: () => cy.get('[data-checkout-form]'),
      planSummary: () => cy.get('[data-plan-summary]'),
      stripeElement: () => cy.get('[data-stripe-element]'),
      submitButton: () => cy.get('[data-checkout-submit]'),
      loadingState: () => cy.get('[data-checkout-loading]'),
      errorMessage: () => cy.get('[data-checkout-error]'),
      successMessage: () => cy.get('[data-checkout-success]'),
    };
  }

  fillPaymentDetails(cardDetails: any): void {
    cy.fillStripeCard(
      cardDetails.number,
      cardDetails.expiry,
      cardDetails.cvc,
      cardDetails.zip
    );
  }

  submitPayment(): void {
    this.getCheckoutForm().submitButton().click();
  }

  waitForPaymentSuccess(): void {
    cy.get('[data-checkout-success]', { timeout: 30000 }).should('exist');
  }
}