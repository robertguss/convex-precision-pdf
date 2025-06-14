import { vi } from 'vitest'

/**
 * Auth mocking utilities for comprehensive authentication testing
 * Provides helpers for mocking Clerk authentication states and user data
 */

export interface MockUser {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  imageUrl?: string
  username?: string
  publicMetadata?: Record<string, any>
  privateMetadata?: Record<string, any>
  unsafeMetadata?: Record<string, any>
  createdAt?: number
  updatedAt?: number
  lastSignInAt?: number | null
  emailVerified?: boolean
}

export interface MockAuthState {
  isLoaded: boolean
  isSignedIn: boolean
  userId: string | null
  sessionId: string | null
  user?: MockUser | null
  session?: any
}

/**
 * Default mock user data for consistent testing
 */
export const DEFAULT_MOCK_USER: MockUser = {
  id: 'user_test123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  imageUrl: 'https://images.clerk.dev/test-avatar',
  username: 'testuser',
  publicMetadata: {},
  privateMetadata: {},
  unsafeMetadata: {},
  createdAt: Date.now() - 86400000, // 1 day ago
  updatedAt: Date.now(),
  lastSignInAt: Date.now() - 3600000, // 1 hour ago
  emailVerified: true
}

/**
 * Mock auth states for different scenarios
 */
export const mockAuthStates = {
  /**
   * Fully authenticated user with complete profile
   */
  authenticated: (): MockAuthState => ({
    isLoaded: true,
    isSignedIn: true,
    userId: DEFAULT_MOCK_USER.id,
    sessionId: 'session_test123',
    user: DEFAULT_MOCK_USER,
    session: {
      id: 'session_test123',
      status: 'active',
      lastActiveAt: Date.now()
    }
  }),

  /**
   * User not signed in
   */
  unauthenticated: (): MockAuthState => ({
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    user: null,
    session: null
  }),

  /**
   * Auth still loading
   */
  loading: (): MockAuthState => ({
    isLoaded: false,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    user: null,
    session: null
  }),

  /**
   * Authenticated user with unverified email
   */
  unverifiedEmail: (): MockAuthState => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_unverified123',
    sessionId: 'session_unverified123',
    user: {
      ...DEFAULT_MOCK_USER,
      id: 'user_unverified123',
      email: 'unverified@example.com',
      emailVerified: false
    },
    session: {
      id: 'session_unverified123',
      status: 'active',
      lastActiveAt: Date.now()
    }
  }),

  /**
   * Authenticated user with minimal profile
   */
  minimalProfile: (): MockAuthState => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_minimal123',
    sessionId: 'session_minimal123',
    user: {
      id: 'user_minimal123',
      email: 'minimal@example.com',
      firstName: null,
      lastName: null,
      imageUrl: null,
      username: null,
      emailVerified: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastSignInAt: Date.now()
    },
    session: {
      id: 'session_minimal123',
      status: 'active',
      lastActiveAt: Date.now()
    }
  }),

  /**
   * Pro subscription user
   */
  proUser: (): MockAuthState => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_pro123',
    sessionId: 'session_pro123',
    user: {
      ...DEFAULT_MOCK_USER,
      id: 'user_pro123',
      email: 'pro@example.com',
      publicMetadata: {
        subscription: 'pro',
        customerId: 'cus_pro123'
      }
    },
    session: {
      id: 'session_pro123',
      status: 'active',
      lastActiveAt: Date.now()
    }
  }),

  /**
   * Business subscription user
   */
  businessUser: (): MockAuthState => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_business123',
    sessionId: 'session_business123',
    user: {
      ...DEFAULT_MOCK_USER,
      id: 'user_business123',
      email: 'business@example.com',
      publicMetadata: {
        subscription: 'business',
        customerId: 'cus_business123'
      }
    },
    session: {
      id: 'session_business123',
      status: 'active',
      lastActiveAt: Date.now()
    }
  }),

  /**
   * User with expired session
   */
  expiredSession: (): MockAuthState => ({
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    user: null,
    session: null
  })
}

/**
 * Mock useAuth hook with customizable return values
 */
export function createMockUseAuth(authState: MockAuthState = mockAuthStates.authenticated()) {
  return vi.fn(() => ({
    ...authState,
    getToken: vi.fn().mockResolvedValue('mock-token'),
    signOut: vi.fn().mockResolvedValue(undefined),
    openSignIn: vi.fn(),
    openSignUp: vi.fn(),
    openUserProfile: vi.fn()
  }))
}

/**
 * Mock useUser hook
 */
export function createMockUseUser(authState: MockAuthState = mockAuthStates.authenticated()) {
  return vi.fn(() => ({
    isLoaded: authState.isLoaded,
    isSignedIn: authState.isSignedIn,
    user: authState.user
  }))
}

/**
 * Mock useSession hook
 */
export function createMockUseSession(authState: MockAuthState = mockAuthStates.authenticated()) {
  return vi.fn(() => ({
    isLoaded: authState.isLoaded,
    isSignedIn: authState.isSignedIn,
    session: authState.session
  }))
}

/**
 * Mock Clerk client methods
 */
export const mockClerkClient = {
  users: {
    getUser: vi.fn(),
    getUserList: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn()
  },
  sessions: {
    getSession: vi.fn(),
    getSessionList: vi.fn(),
    revokeSession: vi.fn()
  },
  organizations: {
    getOrganization: vi.fn(),
    getOrganizationList: vi.fn()
  }
}

/**
 * Setup authentication mocks for a test
 */
export function setupAuthMocks(authState: MockAuthState = mockAuthStates.authenticated()) {
  const mockUseAuth = createMockUseAuth(authState)
  const mockUseUser = createMockUseUser(authState)  
  const mockUseSession = createMockUseSession(authState)

  // Mock Clerk hooks
  vi.mock('@clerk/nextjs', async () => {
    const actual = await vi.importActual('@clerk/nextjs')
    return {
      ...actual,
      useAuth: mockUseAuth,
      useUser: mockUseUser,
      useSession: mockUseSession,
      ClerkProvider: ({ children }: any) => children
    }
  })

  return {
    mockUseAuth,
    mockUseUser,
    mockUseSession,
    mockClerkClient
  }
}

/**
 * Utilities for testing auth flows
 */
export const authTestUtils = {
  /**
   * Simulate sign in process
   */
  simulateSignIn: (userId: string = 'user_signin123') => {
    const authState = mockAuthStates.authenticated()
    authState.userId = userId
    authState.user!.id = userId
    return authState
  },

  /**
   * Simulate sign out process
   */
  simulateSignOut: () => mockAuthStates.unauthenticated(),

  /**
   * Simulate auth loading state
   */
  simulateAuthLoading: () => mockAuthStates.loading(),

  /**
   * Create user with specific metadata
   */
  createUserWithMetadata: (metadata: Record<string, any>, isPublic: boolean = true) => {
    const authState = mockAuthStates.authenticated()
    if (authState.user) {
      if (isPublic) {
        authState.user.publicMetadata = { ...authState.user.publicMetadata, ...metadata }
      } else {
        authState.user.privateMetadata = { ...authState.user.privateMetadata, ...metadata }
      }
    }
    return authState
  },

  /**
   * Create user with specific subscription
   */
  createUserWithSubscription: (subscriptionType: 'free' | 'pro' | 'business') => {
    return authTestUtils.createUserWithMetadata({
      subscription: subscriptionType,
      customerId: `cus_${subscriptionType}123`
    })
  },

  /**
   * Mock token responses
   */
  mockTokenResponses: {
    valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImlhdCI6MTUxNjIzOTAyMn0.mock-signature',
    expired: 'expired-token',
    invalid: 'invalid-token'
  }
}

/**
 * Helper to wait for auth state changes in tests
 */
export async function waitForAuthStateChange(timeout: number = 5000) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeout)
    // In real tests, this would listen to auth state changes
    // For now, just resolve after a short delay
    setTimeout(() => {
      clearTimeout(timer)
      resolve(undefined)
    }, 100)
  })
}

/**
 * Mock organization data
 */
export const mockOrganization = {
  id: 'org_test123',
  name: 'Test Organization',
  slug: 'test-org',
  imageUrl: 'https://images.clerk.dev/test-org-avatar',
  membersCount: 5,
  publicMetadata: {},
  privateMetadata: {},
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now()
}

/**
 * Create mock organization membership
 */
export function createMockOrganizationMembership(role: 'admin' | 'member' = 'member') {
  return {
    id: 'orgmem_test123',
    organization: mockOrganization,
    publicUserData: {
      userId: DEFAULT_MOCK_USER.id,
      firstName: DEFAULT_MOCK_USER.firstName,
      lastName: DEFAULT_MOCK_USER.lastName,
      imageUrl: DEFAULT_MOCK_USER.imageUrl
    },
    role,
    permissions: role === 'admin' ? ['org:sys_domains:manage', 'org:sys_memberships:manage'] : [],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now()
  }
}