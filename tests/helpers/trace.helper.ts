/**
 * Trace analysis helper for Playwright tests
 * Helps with debugging and analyzing test execution
 */

import { Page, BrowserContext } from '@playwright/test';
import path from 'path';

export interface TraceOptions {
  screenshots?: boolean;
  snapshots?: boolean;
  sources?: boolean;
  title?: string;
}

/**
 * Start tracing with enhanced options
 */
export async function startTracing(
  context: BrowserContext,
  name: string,
  options: TraceOptions = {}
) {
  await context.tracing.start({
    screenshots: options.screenshots ?? true,
    snapshots: options.snapshots ?? true,
    sources: options.sources ?? true,
    title: options.title ?? name,
  });
}

/**
 * Stop tracing and save to organized location
 */
export async function stopTracing(
  context: BrowserContext,
  name: string,
  failed: boolean = false
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const status = failed ? 'failed' : 'passed';
  const tracePath = path.join(
    'test-results',
    'traces',
    `${name}-${status}-${timestamp}.zip`
  );
  
  await context.tracing.stop({ path: tracePath });
  
  return tracePath;
}

/**
 * Capture trace only on failure
 */
export async function traceOnFailure(
  context: BrowserContext,
  testName: string,
  testFn: () => Promise<void>
) {
  await startTracing(context, testName);
  
  try {
    await testFn();
    // Stop without saving if test passed
    await context.tracing.stop();
  } catch (error) {
    // Save trace on failure
    const tracePath = await stopTracing(context, testName, true);
    console.log(`Test failed. Trace saved to: ${tracePath}`);
    throw error;
  }
}

/**
 * Add custom events to trace
 */
export async function addTraceEvent(
  page: Page,
  category: string,
  name: string,
  data?: any
) {
  await page.evaluate(({ category, name, data }) => {
    // Add custom performance mark
    performance.mark(`${category}:${name}`, {
      detail: data,
    });
    
    // Log to console for trace visibility
    console.log(`[TRACE] ${category}: ${name}`, data);
  }, { category, name, data });
}

/**
 * Measure operation duration in trace
 */
export async function measureInTrace(
  page: Page,
  operationName: string,
  operation: () => Promise<void>
) {
  await addTraceEvent(page, 'Performance', `${operationName}-start`);
  const startTime = Date.now();
  
  try {
    await operation();
  } finally {
    const duration = Date.now() - startTime;
    await addTraceEvent(page, 'Performance', `${operationName}-end`, { duration });
  }
}

/**
 * Capture detailed error information in trace
 */
export async function captureErrorDetails(
  page: Page,
  error: Error
) {
  // Capture console logs
  const consoleLogs = await page.evaluate(() => {
    return (window as any).__consoleLogs || [];
  });
  
  // Capture page errors
  const pageErrors = await page.evaluate(() => {
    return (window as any).__pageErrors || [];
  });
  
  // Add error details to trace
  await addTraceEvent(page, 'Error', error.name, {
    message: error.message,
    stack: error.stack,
    consoleLogs,
    pageErrors,
    url: page.url(),
    timestamp: new Date().toISOString(),
  });
  
  // Take error screenshot
  await page.screenshot({
    path: `test-results/errors/${error.name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Setup enhanced error capturing
 */
export async function setupErrorCapturing(page: Page) {
  // Capture console logs
  await page.evaluate(() => {
    (window as any).__consoleLogs = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = (...args) => {
      (window as any).__consoleLogs.push({ type: 'log', args, timestamp: Date.now() });
      originalLog.apply(console, args);
    };
    
    console.error = (...args) => {
      (window as any).__consoleLogs.push({ type: 'error', args, timestamp: Date.now() });
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      (window as any).__consoleLogs.push({ type: 'warn', args, timestamp: Date.now() });
      originalWarn.apply(console, args);
    };
  });
  
  // Capture page errors
  await page.evaluate(() => {
    (window as any).__pageErrors = [];
    window.addEventListener('error', (event) => {
      (window as any).__pageErrors.push({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.toString(),
        timestamp: Date.now(),
      });
    });
  });
  
  // Listen to page errors
  page.on('pageerror', async (error) => {
    await captureErrorDetails(page, error);
  });
}

/**
 * Create a timeline of test execution
 */
export class TestTimeline {
  private events: Array<{
    timestamp: number;
    type: string;
    description: string;
    data?: any;
  }> = [];
  
  private startTime = Date.now();
  
  addEvent(type: string, description: string, data?: any) {
    this.events.push({
      timestamp: Date.now() - this.startTime,
      type,
      description,
      data,
    });
  }
  
  async addPageEvent(page: Page, type: string, description: string) {
    const data = {
      url: page.url(),
      title: await page.title(),
    };
    this.addEvent(type, description, data);
    await addTraceEvent(page, 'Timeline', description, data);
  }
  
  generateReport(): string {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Timeline</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .timeline { position: relative; padding: 20px 0; }
          .event { margin: 10px 0; padding: 10px; border-left: 3px solid #007bff; }
          .event.error { border-color: #dc3545; }
          .event.success { border-color: #28a745; }
          .timestamp { color: #666; font-size: 12px; }
          .data { background: #f8f9fa; padding: 5px; margin-top: 5px; font-family: monospace; }
        </style>
      </head>
      <body>
        <h1>Test Execution Timeline</h1>
        <div class="timeline">
          ${this.events.map(event => `
            <div class="event ${event.type}">
              <div class="timestamp">${event.timestamp}ms</div>
              <div class="description">${event.description}</div>
              ${event.data ? `<div class="data">${JSON.stringify(event.data, null, 2)}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <p>Total duration: ${Date.now() - this.startTime}ms</p>
      </body>
      </html>
    `;
    
    return html;
  }
  
  save(filename: string) {
    const fs = require('fs');
    fs.writeFileSync(filename, this.generateReport());
  }
}

/**
 * Debug helper for interactive debugging
 */
export async function debugBreakpoint(
  page: Page,
  message: string = 'Debug breakpoint'
) {
  console.log(`\n🔍 ${message}`);
  console.log(`📍 Current URL: ${page.url()}`);
  console.log(`⏸️  Paused for debugging. Press Enter to continue...`);
  
  // Only pause in headed mode
  if (!process.env.HEADLESS) {
    await page.pause();
  }
}

/**
 * Analyze test flakiness
 */
export async function detectFlakiness(
  testFn: () => Promise<void>,
  runs: number = 5
): Promise<{
  flaky: boolean;
  successRate: number;
  failures: Error[];
}> {
  let successes = 0;
  const failures: Error[] = [];
  
  for (let i = 0; i < runs; i++) {
    try {
      await testFn();
      successes++;
    } catch (error) {
      failures.push(error as Error);
    }
  }
  
  const successRate = successes / runs;
  
  return {
    flaky: successRate > 0 && successRate < 1,
    successRate,
    failures,
  };
}