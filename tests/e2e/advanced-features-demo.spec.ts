/**
 * Demonstration of advanced Playwright features
 * Shows visual testing, performance monitoring, network interception, and tracing
 */

import { test, expect } from '../fixtures/test-fixtures';
import * as network from '../helpers/network.helper';
import * as visual from '../helpers/visual.helper';
import * as performance from '../helpers/performance.helper';
import * as trace from '../helpers/trace.helper';

test.describe('Advanced Features Demo', () => {
  test('visual regression testing', async ({ page, auth }) => {
    // Setup visual testing
    await visual.maskDynamicContent(page);
    
    // Test home page visuals
    await page.goto('/');
    await visual.takeVisualSnapshot(page, 'home-page', { fullPage: true });
    
    // Test responsive design
    await visual.testResponsiveDesign(page, 'home-responsive', [
      { width: 1920, height: 1080, label: 'desktop' },
      { width: 768, height: 1024, label: 'tablet' },
      { width: 375, height: 667, label: 'mobile' },
    ]);
    
    // Test dark mode
    await visual.testDarkMode(page, 'home-theme');
    
    // Test component states
    await visual.testInteractionStates(
      page,
      '[data-cy="upgrade-button"]',
      'upgrade-button-states'
    );
    
    // Test pricing cards
    await page.goto('/pricing');
    await visual.compareComponent(
      page.locator('[data-cy="pricing-cards"]'),
      'pricing-cards'
    );
  });

  test('performance monitoring', async ({ page, context }) => {
    // Define performance budget
    const budget: performance.PerformanceBudget = {
      pageLoad: 3000,
      firstContentfulPaint: 1500,
      largestContentfulPaint: 2500,
      timeToInteractive: 3500,
    };
    
    // Measure home page performance
    await page.goto('/');
    const homeMetrics = await performance.measurePagePerformance(page);
    const homeResults = performance.checkPerformanceBudget(homeMetrics, budget);
    
    // Assert performance budget
    expect(homeResults.passed).toBe(true);
    if (!homeResults.passed) {
      console.log('Performance violations:', homeResults.violations);
    }
    
    // Measure bundle sizes
    const bundleSizes = await performance.measureBundleSizes(page);
    expect(bundleSizes.totalSize).toBeLessThan(5 * 1024 * 1024); // 5MB total
    
    // Benchmark document upload operation
    const uploadBenchmark = await performance.benchmarkOperation(
      page,
      async () => {
        await page.goto('/documents');
        await page.locator('[data-cy="upload-button"]').click();
        await expect(page.locator('[data-cy="file-upload-modal"]')).toBeVisible();
        await page.locator('[data-cy="close-modal"]').click();
      },
      5 // Run 5 times
    );
    
    expect(uploadBenchmark.average).toBeLessThan(1000); // Should open in < 1s
    
    // Check for memory leaks
    const memoryTest = await performance.detectMemoryLeaks(
      page,
      async () => {
        await page.locator('[data-cy="upload-button"]').click();
        await page.locator('[data-cy="close-modal"]').click();
      },
      10
    );
    
    expect(memoryTest.leaked).toBe(false);
    
    // Generate performance report
    await performance.generatePerformanceReport([
      {
        page: 'Home',
        metrics: homeMetrics,
        budget,
        bundleSizes,
      },
    ]);
  });

  test('network interception and mocking', async ({ page, auth, payment }) => {
    // Setup API call logging
    const apiCalls = await network.interceptAPICalls(page);
    
    // Mock Convex responses for testing
    await network.mockConvexQuery(page, 'getUser', {
      _id: 'test-user',
      email: 'test@example.com',
      credits: 100,
      plan: 'pro',
    });
    
    // Mock Stripe webhook
    await network.mockStripeWebhook(page, {
      success: true,
      processed: true,
    });
    
    // Test with slow network
    await network.simulateSlowNetwork(page, 2000);
    await page.goto('/dashboard');
    
    // Should show loading state
    await expect(page.locator('[data-cy="loading-spinner"]')).toBeVisible();
    
    // Wait for content
    await expect(page.locator('[data-cy="dashboard-content"]')).toBeVisible({
      timeout: 15000,
    });
    
    // Test network failure handling
    await network.simulateNetworkFailure(page, '**/api/documents/**');
    await page.goto('/documents');
    
    // Should show error state
    await expect(page.locator('[data-cy="network-error"]')).toBeVisible();
    
    // Verify API calls were made
    const documentAPICalls = apiCalls.filter(call => 
      call.url.includes('/api/documents')
    );
    expect(documentAPICalls.length).toBeGreaterThan(0);
  });

  test('enhanced tracing and debugging', async ({ page, context, auth }) => {
    // Create timeline tracker
    const timeline = new trace.TestTimeline();
    
    // Setup error capturing
    await trace.setupErrorCapturing(page);
    
    // Start enhanced tracing
    await trace.startTracing(context, 'payment-flow-trace', {
      screenshots: true,
      snapshots: true,
      sources: true,
      title: 'Payment Flow Debug Trace',
    });
    
    try {
      // Track navigation
      timeline.addEvent('navigation', 'Navigating to home');
      await page.goto('/');
      await timeline.addPageEvent(page, 'navigation', 'Home page loaded');
      
      // Login
      await trace.measureInTrace(page, 'user-login', async () => {
        await auth.loginAsUser(page, 'free');
      });
      timeline.addEvent('auth', 'User logged in');
      
      // Navigate to pricing
      await trace.addTraceEvent(page, 'User Action', 'Navigating to pricing');
      await payment.navigateToUpgrade(page, 'pro');
      timeline.addEvent('navigation', 'Pricing page loaded');
      
      // Debug breakpoint (only in headed mode)
      await trace.debugBreakpoint(page, 'About to start upgrade flow');
      
      // Start upgrade
      await trace.measureInTrace(page, 'upgrade-initiation', async () => {
        await page.locator('[data-cy="pro-plan-card"] [data-cy="upgrade-button"]').click();
      });
      
      // Save timeline
      timeline.save('test-results/payment-flow-timeline.html');
      
    } finally {
      // Stop tracing
      const tracePath = await trace.stopTracing(context, 'payment-flow-trace');
      console.log(`Trace saved to: ${tracePath}`);
    }
  });

  test('accessibility testing', async ({ page }) => {
    await page.goto('/');
    
    // Get accessibility tree
    const accessibilitySnapshot = await visual.testAccessibility(page);
    expect(accessibilitySnapshot).toBeTruthy();
    
    // Check color contrast
    const buttonContrast = await visual.checkColorContrast(
      page,
      '[data-cy="upgrade-button"]'
    );
    
    expect(buttonContrast?.meetsWCAG_AA).toBe(true);
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test screen reader labels
    const upgradeButton = page.locator('[data-cy="upgrade-button"]');
    const ariaLabel = await upgradeButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('flakiness detection', async ({ page, auth }) => {
    // Test for potential flakiness
    const flakiness = await trace.detectFlakiness(async () => {
      await page.goto('/');
      await auth.loginAsUser(page, 'free');
      await expect(page.locator('[data-cy="dashboard-content"]')).toBeVisible({
        timeout: 5000,
      });
    }, 3); // Run 3 times
    
    expect(flakiness.flaky).toBe(false);
    expect(flakiness.successRate).toBe(1);
  });

  test('advanced visual testing with loading states', async ({ page, document }) => {
    await page.goto('/documents');
    
    // Capture loading state progression
    const loadingScreenshots = await visual.captureLoadingStates(
      page,
      async () => {
        await document.uploadFile(page, 'test-small.pdf');
        await document.waitForProcessing(page);
      }
    );
    
    // We should have captured multiple states
    expect(loadingScreenshots.length).toBeGreaterThan(5);
    
    // Save loading progression for analysis
    const fs = require('fs');
    loadingScreenshots.forEach((screenshot, index) => {
      fs.writeFileSync(
        `test-results/loading-state-${index}.png`,
        screenshot
      );
    });
  });

  test('API performance profiling', async ({ page, auth }) => {
    // Monitor API performance
    const apiMetrics = await performance.measureAPIPerformance(page);
    
    // Login and navigate
    await auth.loginAsUser(page, 'pro');
    await page.goto('/documents');
    
    // Analyze API metrics
    const slowAPIs = apiMetrics.filter(metric => metric.duration > 1000);
    expect(slowAPIs.length).toBe(0);
    
    // Check payload sizes
    const largePayloads = apiMetrics.filter(metric => metric.size > 100000); // 100KB
    expect(largePayloads.length).toBe(0);
  });
});