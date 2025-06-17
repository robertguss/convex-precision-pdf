/**
 * Network helper functions for Playwright tests
 * Handles API mocking, request interception, and webhook simulation
 */

import { Page, Route, Request } from '@playwright/test';

export interface WebhookPayload {
  type: string;
  data: {
    object: any;
  };
}

/**
 * Mock Stripe webhook responses
 */
export async function mockStripeWebhook(page: Page, response: any = { success: true }) {
  await page.route('/api/webhooks/stripe', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Intercept and log all API calls
 */
export async function interceptAPICalls(page: Page, pattern: string = '/api/**') {
  const apiCalls: { url: string; method: string; payload?: any; response?: any }[] = [];
  
  await page.route(pattern, async (route) => {
    const request = route.request();
    const response = await route.fetch();
    
    const call = {
      url: request.url(),
      method: request.method(),
      payload: request.method() !== 'GET' ? await request.postDataJSON().catch(() => null) : null,
      response: await response.json().catch(() => null),
    };
    
    apiCalls.push(call);
    
    await route.fulfill({ response });
  });
  
  return apiCalls;
}

/**
 * Mock Convex API responses
 */
export async function mockConvexQuery(page: Page, functionName: string, response: any) {
  await page.route(`**/api/convex/**/${functionName}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Simulate network conditions
 */
export async function simulateSlowNetwork(page: Page, latency: number = 3000) {
  // Add latency to all requests
  await page.route('**/*', async (route) => {
    await new Promise(resolve => setTimeout(resolve, latency));
    await route.continue();
  });
}

/**
 * Simulate network failure for specific endpoints
 */
export async function simulateNetworkFailure(page: Page, urlPattern: string) {
  await page.route(urlPattern, async (route) => {
    await route.abort('failed');
  });
}

/**
 * Wait for specific API call
 */
export async function waitForAPICall(
  page: Page,
  urlPattern: string,
  options: { timeout?: number; method?: string } = {}
): Promise<Request> {
  return await page.waitForRequest(
    (request) => {
      const matchesUrl = request.url().includes(urlPattern);
      const matchesMethod = !options.method || request.method() === options.method;
      return matchesUrl && matchesMethod;
    },
    { timeout: options.timeout || 10000 }
  );
}

/**
 * Mock Stripe Checkout session
 */
export async function mockStripeCheckout(page: Page, sessionId: string = 'cs_test_123') {
  await page.route('**/v1/checkout/sessions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: sessionId,
        url: `https://checkout.stripe.com/pay/${sessionId}`,
        payment_status: 'unpaid',
      }),
    });
  });
}

/**
 * Simulate webhook delivery
 */
export async function deliverWebhook(
  page: Page,
  endpoint: string,
  payload: WebhookPayload,
  signature?: string
) {
  const response = await page.request.post(endpoint, {
    data: payload,
    headers: signature ? { 'stripe-signature': signature } : {},
  });
  
  return {
    status: response.status(),
    body: await response.json().catch(() => null),
  };
}

/**
 * Record and replay network traffic
 */
export class NetworkRecorder {
  private recordings: Map<string, any> = new Map();
  
  async startRecording(page: Page) {
    await page.route('**/*', async (route) => {
      const request = route.request();
      const response = await route.fetch();
      
      const key = `${request.method()}_${request.url()}`;
      this.recordings.set(key, {
        status: response.status(),
        headers: response.headers(),
        body: await response.body(),
      });
      
      await route.continue();
    });
  }
  
  async replay(page: Page) {
    await page.route('**/*', async (route) => {
      const request = route.request();
      const key = `${request.method()}_${request.url()}`;
      
      if (this.recordings.has(key)) {
        const recording = this.recordings.get(key);
        await route.fulfill(recording);
      } else {
        await route.continue();
      }
    });
  }
  
  save(filename: string) {
    const fs = require('fs');
    const data = Array.from(this.recordings.entries());
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  }
  
  load(filename: string) {
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    this.recordings = new Map(data);
  }
}

/**
 * Monitor performance metrics
 */
export async function measureAPIPerformance(page: Page) {
  const metrics: { url: string; duration: number; size: number }[] = [];
  
  page.on('response', async (response) => {
    const timing = response.timing();
    if (timing && response.url().includes('/api/')) {
      metrics.push({
        url: response.url(),
        duration: timing.responseEnd - timing.requestStart,
        size: parseInt(response.headers()['content-length'] || '0'),
      });
    }
  });
  
  return metrics;
}