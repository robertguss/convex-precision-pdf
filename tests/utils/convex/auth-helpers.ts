import { vi } from 'vitest'
import { createConvexTest } from './setup'

/**
 * Mock user identity for Convex auth testing
 */
export interface MockUserIdentity {
  subject: string
  issuer: string
  tokenIdentifier: string
  name?: string
  email?: string
  picture?: string
}

/**
 * Create a mock user identity with default values
 */
export const createMockUserIdentity = (
  overrides: Partial<MockUserIdentity> = {}
): MockUserIdentity => ({
  subject: 'test-user-id',
  issuer: 'https://clerk.test',
  tokenIdentifier: 'test-token-id',
  name: 'Test User',
  email: 'test@example.com',
  picture: 'https://example.com/avatar.jpg',
  ...overrides,
})

/**
 * Create multiple mock user identities for testing
 */
export const createMockUsers = (count: number = 3): MockUserIdentity[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockUserIdentity({
      subject: `test-user-${i + 1}`,
      tokenIdentifier: `test-token-${i + 1}`,
      name: `Test User ${i + 1}`,
      email: `test${i + 1}@example.com`,
    })
  )
}

/**
 * Helper to test authenticated Convex functions
 */
export const withAuthenticatedUser = async <T>(
  userIdentity: MockUserIdentity,
  testFn: (t: ReturnType<typeof createConvexTest>) => Promise<T>
): Promise<T> => {
  const t = createConvexTest()
  t.withIdentity(userIdentity)
  return await testFn(t)
}

/**
 * Helper to test unauthenticated scenarios
 */
export const withUnauthenticatedUser = async <T>(
  testFn: (t: ReturnType<typeof createConvexTest>) => Promise<T>
): Promise<T> => {
  const t = createConvexTest()
  // No identity set - user is unauthenticated
  return await testFn(t)
}

/**
 * Mock auth context for component testing
 */
export const mockAuthContext = {
  isLoaded: true,
  isSignedIn: true,
  user: {
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'Test',
    lastName: 'User',
    imageUrl: 'https://example.com/avatar.jpg',
  },
  signOut: vi.fn(),
  signIn: vi.fn(),
}

/**
 * Mock unauthenticated context for component testing
 */
export const mockUnauthenticatedContext = {
  isLoaded: true,
  isSignedIn: false,
  user: null,
  signOut: vi.fn(),
  signIn: vi.fn(),
}

/**
 * Helper to create subscription context for testing
 */
export const createMockSubscriptionContext = (
  tier: 'free' | 'pro' | 'business' = 'free',
  credits: number = 10,
  overrides: Record<string, any> = {}
) => ({
  subscription: {
    id: 'test-subscription-id',
    tier,
    credits,
    creditsUsed: 0,
    isActive: tier !== 'free',
    stripeCustomerId: 'cus_test_123',
    stripeSubscriptionId: tier !== 'free' ? 'sub_test_123' : null,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ...overrides,
  },
  isLoading: false,
  refetch: vi.fn(),
})

/**
 * Helper to test role-based access control
 */
export const testRoleAccess = async (
  roles: string[],
  testFn: (t: ReturnType<typeof createConvexTest>, role: string) => Promise<void>
) => {
  for (const role of roles) {
    const userIdentity = createMockUserIdentity({
      subject: `user-${role}`,
      tokenIdentifier: `token-${role}`,
    })
    
    await withAuthenticatedUser(userIdentity, async (t) => {
      await testFn(t, role)
    })
  }
}