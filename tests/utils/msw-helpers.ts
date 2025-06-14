import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { 
  clerkMockHelpers, 
  stripeMockHelpers, 
  landingAIMockHelpers,
  DEFAULT_MOCK_USER 
} from '../mocks/handlers/clerk'
import { 
  DEFAULT_MOCK_CUSTOMER,
  DEFAULT_MOCK_SUBSCRIPTION
} from '../mocks/handlers/stripe'
import { 
  DEFAULT_MOCK_DOCUMENT_RESPONSE
} from '../mocks/handlers/landing-ai'

/**
 * Test utilities for working with MSW mocks
 * Provides convenient helpers for setting up API responses in tests
 */

export interface MockScenario {
  name: string
  handlers: any[]
}

/**
 * Override MSW handlers for specific test scenarios
 */
export function mockAPIResponse(...handlers: any[]) {
  server.use(...handlers)
}

/**
 * Reset all handlers to their default state
 */
export function resetMockHandlers() {
  server.resetHandlers()
}

/**
 * Common test scenarios for quick setup
 */
export const mockScenarios = {
  /**
   * Authenticated user with active subscription
   */
  authenticatedProUser: (): MockScenario => ({
    name: 'Authenticated Pro User',
    handlers: [
      // Mock authenticated Clerk user
      http.get('*/v1/me', () => {
        return HttpResponse.json({
          ...DEFAULT_MOCK_USER,
          email_addresses: [{
            id: 'email_test123',
            email_address: 'pro@example.com',
            verification: { status: 'complete', strategy: 'email_code' }
          }]
        })
      }),
      // Mock active Pro subscription
      http.get('*/v1/subscriptions/*', () => {
        return HttpResponse.json({
          ...DEFAULT_MOCK_SUBSCRIPTION,
          status: 'active',
          metadata: { plan_id: 'pro' }
        })
      })
    ]
  }),

  /**
   * Unauthenticated user
   */
  unauthenticatedUser: (): MockScenario => ({
    name: 'Unauthenticated User',
    handlers: [
      http.get('*/v1/me', () => {
        return HttpResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      })
    ]
  }),

  /**
   * User with canceled subscription
   */
  canceledSubscription: (): MockScenario => ({
    name: 'Canceled Subscription',
    handlers: [
      http.get('*/v1/subscriptions/*', () => {
        return HttpResponse.json({
          ...DEFAULT_MOCK_SUBSCRIPTION,
          status: 'canceled',
          canceled_at: Math.floor(Date.now() / 1000),
          cancel_at_period_end: false
        })
      })
    ]
  }),

  /**
   * Payment failure scenario
   */
  paymentFailure: (): MockScenario => ({
    name: 'Payment Failure',
    handlers: [
      http.post('*/v1/subscriptions', () => {
        return HttpResponse.json(
          { error: { message: 'Your card was declined.' } },
          { status: 402 }
        )
      })
    ]
  }),

  /**
   * Document processing success
   */
  documentProcessingSuccess: (): MockScenario => ({
    name: 'Document Processing Success',
    handlers: [
      http.post('*/api/process-document', () => {
        return HttpResponse.json({
          job_id: 'job_success123',
          status: 'processing',
          progress: 0
        }, { status: 202 })
      }),
      http.get('*/api/process-status/job_success123', () => {
        return HttpResponse.json({
          job_id: 'job_success123',
          status: 'completed',
          progress: 100,
          result_url: '/api/results/job_success123'
        })
      }),
      http.get('*/api/results/job_success123', () => {
        return HttpResponse.json(landingAIMockHelpers.mockDocumentResponse())
      })
    ]
  }),

  /**
   * Document processing failure
   */
  documentProcessingFailure: (): MockScenario => ({
    name: 'Document Processing Failure',
    handlers: [
      http.get('*/api/process-status/job_failed123', () => {
        return HttpResponse.json({
          job_id: 'job_failed123',
          status: 'failed',
          progress: 50,
          error: 'Unable to process document',
          created_at: new Date(Date.now() - 60000).toISOString(),
          updated_at: new Date().toISOString()
        })
      })
    ]
  }),

  /**
   * API service unavailable
   */
  serviceUnavailable: (): MockScenario => ({
    name: 'Service Unavailable',
    handlers: [
      http.post('*/api/process-document', () => {
        return HttpResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        )
      })
    ]
  }),

  /**
   * Large document processing
   */
  largeDocument: (pageCount: number = 50): MockScenario => ({
    name: `Large Document (${pageCount} pages)`,
    handlers: [
      http.get('*/api/results/*', () => {
        const pages = Array.from({ length: pageCount }, (_, index) => ({
          page: index + 1,
          width: 612,
          height: 792,
          chunks: [
            {
              id: `chunk_${index + 1}_1`,
              text: `Content from page ${index + 1}`,
              confidence: 0.9 + Math.random() * 0.1,
              bounding_box: {
                x: 72,
                y: 72,
                width: 400,
                height: 24
              }
            }
          ]
        }))

        return HttpResponse.json({
          pages,
          metadata: {
            total_pages: pageCount,
            processing_time_ms: pageCount * 500,
            confidence_threshold: 0.8,
            detected_language: 'en'
          }
        })
      })
    ]
  })
}

/**
 * Apply a test scenario to MSW
 */
export function useMockScenario(scenario: MockScenario) {
  mockAPIResponse(...scenario.handlers)
}

/**
 * Create a custom mock response for any endpoint
 */
export function mockEndpoint(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, response: any, status: number = 200) {
  const httpMethod = {
    'GET': http.get,
    'POST': http.post,
    'PUT': http.put,
    'DELETE': http.delete
  }[method]

  return httpMethod(url, () => {
    return HttpResponse.json(response, { status })
  })
}

/**
 * Mock network delays for testing loading states
 */
export function mockWithDelay(handler: any, delayMs: number = 1000) {
  return async (info: any) => {
    await new Promise(resolve => setTimeout(resolve, delayMs))
    return handler(info)
  }
}

/**
 * Utilities for testing specific error conditions
 */
export const mockErrors = {
  /**
   * Network timeout
   */
  timeout: (url: string) => http.get(url, async () => {
    await new Promise(resolve => setTimeout(resolve, 30000)) // 30s timeout
    return HttpResponse.json({ error: 'Timeout' }, { status: 408 })
  }),

  /**
   * Rate limiting
   */
  rateLimited: (url: string) => http.get(url, () => {
    return HttpResponse.json(
      { error: 'Rate limit exceeded' },
      { 
        status: 429,
        headers: {
          'Retry-After': '60'
        }
      }
    )
  }),

  /**
   * Server error
   */
  serverError: (url: string) => http.get(url, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }),

  /**
   * Validation error
   */
  validationError: (url: string, message: string = 'Validation failed') => http.post(url, () => {
    return HttpResponse.json(
      { error: message, details: ['Field is required'] },
      { status: 422 }
    )
  })
}

/**
 * Wait for MSW to process all pending requests
 */
export async function waitForMockRequests() {
  // Small delay to allow MSW to process requests
  await new Promise(resolve => setTimeout(resolve, 100))
}

/**
 * Debug utility to log all intercepted requests
 */
export function enableMockRequestLogging() {
  server.events.on('request:start', ({ request }) => {
    console.log('MSW intercepted:', request.method, request.url)
  })
}

/**
 * Get count of requests made to a specific endpoint
 */
export function getRequestCount(url: string): number {
  // This would require tracking requests, implementation depends on testing needs
  // For now, return 0 as placeholder
  return 0
}