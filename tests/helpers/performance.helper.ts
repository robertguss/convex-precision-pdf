/**
 * Performance testing helper functions for Playwright
 * Handles performance metrics, benchmarking, and monitoring
 */

import { Page, Browser } from '@playwright/test';

export interface PerformanceMetrics {
  pageLoad: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  memoryUsage?: number;
}

export interface PerformanceBudget {
  pageLoad?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  timeToInteractive?: number;
  bundleSize?: number;
}

/**
 * Measure page load performance metrics
 */
export async function measurePagePerformance(page: Page): Promise<PerformanceMetrics> {
  // Ensure we're measuring from the start
  await page.goto('about:blank');
  
  // Navigate to the target page
  const startTime = Date.now();
  await page.goto(page.url());
  
  // Wait for load
  await page.waitForLoadState('networkidle');
  
  // Collect performance metrics
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    
    // Get LCP
    let largestContentfulPaint = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // Calculate Time to Interactive (simplified)
    const timeToInteractive = navigation.loadEventEnd - navigation.fetchStart;
    
    // Get memory usage if available
    const memory = (performance as any).memory;
    
    return {
      pageLoad: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      firstPaint: firstPaint ? firstPaint.startTime : 0,
      firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime : 0,
      largestContentfulPaint,
      timeToInteractive,
      totalBlockingTime: 0, // Would need more complex calculation
      cumulativeLayoutShift: 0, // Would need observer
      memoryUsage: memory ? memory.usedJSHeapSize : undefined,
    };
  });
  
  return metrics;
}

/**
 * Check if performance meets budget
 */
export function checkPerformanceBudget(
  metrics: PerformanceMetrics,
  budget: PerformanceBudget
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];
  
  if (budget.pageLoad && metrics.pageLoad > budget.pageLoad) {
    violations.push(`Page load time (${metrics.pageLoad}ms) exceeds budget (${budget.pageLoad}ms)`);
  }
  
  if (budget.firstContentfulPaint && metrics.firstContentfulPaint > budget.firstContentfulPaint) {
    violations.push(`FCP (${metrics.firstContentfulPaint}ms) exceeds budget (${budget.firstContentfulPaint}ms)`);
  }
  
  if (budget.largestContentfulPaint && metrics.largestContentfulPaint > budget.largestContentfulPaint) {
    violations.push(`LCP (${metrics.largestContentfulPaint}ms) exceeds budget (${budget.largestContentfulPaint}ms)`);
  }
  
  if (budget.timeToInteractive && metrics.timeToInteractive > budget.timeToInteractive) {
    violations.push(`TTI (${metrics.timeToInteractive}ms) exceeds budget (${budget.timeToInteractive}ms)`);
  }
  
  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Profile JavaScript execution
 */
export async function profileJavaScript(
  page: Page,
  action: () => Promise<void>
): Promise<{ duration: number; profile: any }> {
  // Start profiling
  await page.coverage.startJSCoverage();
  const startTime = Date.now();
  
  // Perform action
  await action();
  
  // Stop profiling
  const coverage = await page.coverage.stopJSCoverage();
  const duration = Date.now() - startTime;
  
  // Analyze coverage
  const totalBytes = coverage.reduce((total, entry) => total + entry.text.length, 0);
  const usedBytes = coverage.reduce((total, entry) => {
    return total + entry.ranges.reduce((sum, range) => sum + range.end - range.start, 0);
  }, 0);
  
  return {
    duration,
    profile: {
      coverage,
      totalBytes,
      usedBytes,
      percentUsed: (usedBytes / totalBytes) * 100,
    },
  };
}

/**
 * Measure bundle sizes
 */
export async function measureBundleSizes(page: Page): Promise<{
  totalSize: number;
  jsSize: number;
  cssSize: number;
  imageSize: number;
  breakdown: { url: string; size: number; type: string }[];
}> {
  const breakdown: { url: string; size: number; type: string }[] = [];
  let totalSize = 0;
  let jsSize = 0;
  let cssSize = 0;
  let imageSize = 0;
  
  // Listen to all responses
  page.on('response', async (response) => {
    const url = response.url();
    const headers = response.headers();
    const size = parseInt(headers['content-length'] || '0', 10);
    
    if (size > 0) {
      totalSize += size;
      let type = 'other';
      
      if (url.endsWith('.js') || headers['content-type']?.includes('javascript')) {
        jsSize += size;
        type = 'javascript';
      } else if (url.endsWith('.css') || headers['content-type']?.includes('css')) {
        cssSize += size;
        type = 'css';
      } else if (headers['content-type']?.includes('image')) {
        imageSize += size;
        type = 'image';
      }
      
      breakdown.push({ url, size, type });
    }
  });
  
  // Navigate and wait for load
  await page.goto(page.url());
  await page.waitForLoadState('networkidle');
  
  return {
    totalSize,
    jsSize,
    cssSize,
    imageSize,
    breakdown: breakdown.sort((a, b) => b.size - a.size),
  };
}

/**
 * Benchmark specific operations
 */
export async function benchmarkOperation(
  page: Page,
  operation: () => Promise<void>,
  iterations: number = 10
): Promise<{
  average: number;
  min: number;
  max: number;
  median: number;
  results: number[];
}> {
  const results: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    await operation();
    const duration = Date.now() - startTime;
    results.push(duration);
    
    // Reset state between iterations if needed
    await page.reload();
  }
  
  // Calculate statistics
  results.sort((a, b) => a - b);
  const average = results.reduce((sum, val) => sum + val, 0) / results.length;
  const min = results[0];
  const max = results[results.length - 1];
  const median = results[Math.floor(results.length / 2)];
  
  return { average, min, max, median, results };
}

/**
 * Monitor memory leaks
 */
export async function detectMemoryLeaks(
  page: Page,
  action: () => Promise<void>,
  iterations: number = 5
): Promise<{
  leaked: boolean;
  initialMemory: number;
  finalMemory: number;
  memoryGrowth: number;
}> {
  // Force garbage collection
  await page.evaluate(() => {
    if ((window as any).gc) {
      (window as any).gc();
    }
  });
  
  // Get initial memory
  const initialMemory = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });
  
  // Perform action multiple times
  for (let i = 0; i < iterations; i++) {
    await action();
    await page.waitForTimeout(100);
  }
  
  // Force garbage collection again
  await page.evaluate(() => {
    if ((window as any).gc) {
      (window as any).gc();
    }
  });
  
  // Get final memory
  const finalMemory = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });
  
  const memoryGrowth = finalMemory - initialMemory;
  const growthPercentage = (memoryGrowth / initialMemory) * 100;
  
  return {
    leaked: growthPercentage > 10, // Consider >10% growth as potential leak
    initialMemory,
    finalMemory,
    memoryGrowth,
  };
}

/**
 * Generate performance report
 */
export async function generatePerformanceReport(
  results: {
    page: string;
    metrics: PerformanceMetrics;
    budget?: PerformanceBudget;
    bundleSizes?: any;
  }[]
): Promise<string> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Performance Test Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .page-report { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
        .metric { margin: 10px 0; }
        .good { color: green; }
        .bad { color: red; }
        .chart { width: 100%; height: 200px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <h1>Performance Test Report</h1>
      <p>Generated: ${new Date().toISOString()}</p>
      
      ${results.map(result => `
        <div class="page-report">
          <h2>${result.page}</h2>
          
          <h3>Core Web Vitals</h3>
          <div class="metric">
            FCP: <span class="${result.metrics.firstContentfulPaint < 1800 ? 'good' : 'bad'}">
              ${result.metrics.firstContentfulPaint.toFixed(0)}ms
            </span>
          </div>
          <div class="metric">
            LCP: <span class="${result.metrics.largestContentfulPaint < 2500 ? 'good' : 'bad'}">
              ${result.metrics.largestContentfulPaint.toFixed(0)}ms
            </span>
          </div>
          <div class="metric">
            TTI: <span class="${result.metrics.timeToInteractive < 3800 ? 'good' : 'bad'}">
              ${result.metrics.timeToInteractive.toFixed(0)}ms
            </span>
          </div>
          
          ${result.bundleSizes ? `
            <h3>Bundle Sizes</h3>
            <table>
              <tr>
                <th>Type</th>
                <th>Size</th>
              </tr>
              <tr>
                <td>JavaScript</td>
                <td>${(result.bundleSizes.jsSize / 1024).toFixed(2)} KB</td>
              </tr>
              <tr>
                <td>CSS</td>
                <td>${(result.bundleSizes.cssSize / 1024).toFixed(2)} KB</td>
              </tr>
              <tr>
                <td>Images</td>
                <td>${(result.bundleSizes.imageSize / 1024).toFixed(2)} KB</td>
              </tr>
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>${(result.bundleSizes.totalSize / 1024).toFixed(2)} KB</strong></td>
              </tr>
            </table>
          ` : ''}
        </div>
      `).join('')}
    </body>
    </html>
  `;
  
  const fs = require('fs');
  const reportPath = 'performance-report.html';
  fs.writeFileSync(reportPath, html);
  
  return reportPath;
}

/**
 * Run lighthouse audit
 */
export async function runLighthouseAudit(browser: Browser, url: string) {
  // This would integrate with Lighthouse
  // For now, return a placeholder
  return {
    performance: 0.95,
    accessibility: 0.98,
    bestPractices: 0.92,
    seo: 0.96,
  };
}