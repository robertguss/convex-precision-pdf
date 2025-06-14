import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { vi } from 'vitest'

/**
 * Test render utilities for consistent provider setup across all component tests
 */

// Mock Convex client for testing
const mockConvexClient = {
  query: vi.fn(),
  mutation: vi.fn(), 
  action: vi.fn(),
  setAuth: vi.fn(),
  clearAuth: vi.fn(),
  connectionState: () => ({ isWebSocketConnected: true }),
  watchQuery: vi.fn(),
  localQuery: vi.fn(),
  localMutation: vi.fn(),
  localAction: vi.fn()
} as any

// Mock useAuth hook for Clerk
const mockUseAuth = vi.fn(() => ({
  isLoaded: true,
  isSignedIn: true,
  userId: 'test-user-id',
  sessionId: 'test-session-id',
  getToken: vi.fn().mockResolvedValue('test-token')
}))

/**
 * Custom render function that includes all necessary providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Initial auth state for the test
   */
  authState?: {
    isLoaded?: boolean
    isSignedIn?: boolean
    userId?: string | null
    sessionId?: string | null
  }
  /**
   * Custom query client for the test
   */
  queryClient?: QueryClient
  /**
   * Whether to include Clerk provider (default: true)
   * Note: In tests, Clerk is mocked at hook level to avoid Next.js router issues
   */
  includeClerk?: boolean
  /**
   * Whether to include Convex provider (default: true)
   */
  includeConvex?: boolean
  /**
   * Whether to include React Query provider (default: true)
   */
  includeReactQuery?: boolean
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function AllTheProviders({ 
  children, 
  authState = {},
  queryClient = createTestQueryClient(),
  includeConvex = true,
  includeReactQuery = true
}: {
  children: React.ReactNode
} & Omit<CustomRenderOptions, 'includeClerk'>) {
  // Setup mock auth state
  const mockAuth = {
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    getToken: vi.fn().mockResolvedValue('test-token'),
    ...authState
  }
  
  mockUseAuth.mockReturnValue(mockAuth)

  let wrappedChildren = children

  // Wrap with React Query provider
  if (includeReactQuery) {
    wrappedChildren = (
      <QueryClientProvider client={queryClient}>
        {wrappedChildren}
      </QueryClientProvider>
    )
  }

  // Wrap with Convex provider
  if (includeConvex) {
    wrappedChildren = (
      <ConvexProviderWithClerk client={mockConvexClient} useAuth={mockUseAuth}>
        {wrappedChildren}
      </ConvexProviderWithClerk>
    )
  }

  // For testing, we'll mock Clerk at the hook level instead of wrapping with ClerkProvider
  // This avoids Next.js App Router mounting issues in test environment

  return <>{wrappedChildren}</>
}

/**
 * Custom render function with all providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { 
    authState, 
    queryClient, 
    includeConvex, 
    includeReactQuery,
    ...renderOptions 
  } = options

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders
        authState={authState}
        queryClient={queryClient}
        includeConvex={includeConvex}
        includeReactQuery={includeReactQuery}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

/**
 * Render with only specific providers (for targeted testing)
 */
export function renderWithConvexOnly(ui: React.ReactElement, options: CustomRenderOptions = {}) {
  return renderWithProviders(ui, {
    ...options,
    includeReactQuery: false
  })
}

export function renderWithReactQueryOnly(ui: React.ReactElement, options: CustomRenderOptions = {}) {
  return renderWithProviders(ui, {
    ...options,
    includeConvex: false
  })
}

/**
 * Pre-configured render functions for common scenarios
 */
export function renderForAuthenticatedUser(ui: React.ReactElement, options: CustomRenderOptions = {}) {
  return renderWithProviders(ui, {
    authState: {
      isLoaded: true,
      isSignedIn: true,
      userId: 'authenticated-user-id',
      sessionId: 'authenticated-session-id'
    },
    ...options
  })
}

export function renderForUnauthenticatedUser(ui: React.ReactElement, options: CustomRenderOptions = {}) {
  return renderWithProviders(ui, {
    authState: {
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      sessionId: null
    },
    ...options
  })
}

export function renderForLoadingAuth(ui: React.ReactElement, options: CustomRenderOptions = {}) {
  return renderWithProviders(ui, {
    authState: {
      isLoaded: false,
      isSignedIn: false,
      userId: null,
      sessionId: null
    },
    ...options
  })
}

/**
 * Utilities for accessing mocked providers in tests
 */
export const testUtils = {
  mockConvexClient,
  mockUseAuth,
  createTestQueryClient
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { renderWithProviders as render }