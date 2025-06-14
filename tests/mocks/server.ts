import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * MSW server for mocking external APIs during testing
 * Used for unit and integration tests only
 * E2E tests should use real APIs
 */
export const server = setupServer(...handlers)

/**
 * Configure server for test environment
 */
export function setupMockServer() {
  // Start server before all tests
  beforeAll(() => {
    server.listen({ 
      onUnhandledRequest: 'warn' // Change to 'error' for stricter testing
    })
  })

  // Reset handlers after each test to ensure clean state
  afterEach(() => {
    server.resetHandlers()
  })

  // Clean up after all tests
  afterAll(() => {
    server.close()
  })
}

/**
 * Helper to override specific handlers during tests
 */
export function mockHandler(...overrideHandlers: any[]) {
  server.use(...overrideHandlers)
}

/**
 * Reset all handlers to their original state
 */
export function resetMockHandlers() {
  server.resetHandlers()
}