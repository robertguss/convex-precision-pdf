import { http, HttpResponse } from 'msw'

/**
 * Mock Clerk API responses for testing
 * Simulates authentication states and user data
 */

export const DEFAULT_MOCK_USER = {
  id: 'user_test123',
  email_addresses: [{
    id: 'email_test123',
    email_address: 'test@example.com',
    verification: {
      status: 'complete',
      strategy: 'email_code'
    }
  }],
  first_name: 'Test',
  last_name: 'User',
  image_url: 'https://example.com/avatar.jpg',
  has_image: false,
  primary_email_address_id: 'email_test123',
  primary_phone_number_id: null,
  username: null,
  created_at: Date.now() - 86400000, // 1 day ago
  updated_at: Date.now()
}

export const clerkHandlers = [
  /**
   * Mock user session verification
   */
  http.get('*/v1/me', ({ request }) => {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.includes('Bearer')) {
      return HttpResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    return HttpResponse.json(DEFAULT_MOCK_USER)
  }),

  /**
   * Mock user creation/sign up
   */
  http.post('*/v1/users', async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      ...DEFAULT_MOCK_USER,
      email_addresses: [{
        ...DEFAULT_MOCK_USER.email_addresses[0],
        email_address: body.email_address || DEFAULT_MOCK_USER.email_addresses[0].email_address
      }],
      first_name: body.first_name || DEFAULT_MOCK_USER.first_name,
      last_name: body.last_name || DEFAULT_MOCK_USER.last_name
    }, { status: 201 })
  }),

  /**
   * Mock session list
   */
  http.get('*/v1/sessions', () => {
    return HttpResponse.json([
      {
        id: 'sess_test123',
        user_id: DEFAULT_MOCK_USER.id,
        status: 'active',
        created_at: Date.now() - 3600000, // 1 hour ago
        updated_at: Date.now(),
        abandon_at: Date.now() + 86400000 // 1 day from now
      }
    ])
  }),

  /**
   * Mock JWT verification
   */
  http.get('*/v1/jwks', () => {
    return HttpResponse.json({
      keys: [
        {
          use: 'sig',
          kty: 'RSA',
          kid: 'mock_key_id',
          alg: 'RS256',
          n: 'mock_modulus',
          e: 'AQAB'
        }
      ]
    })
  }),

  /**
   * Mock webhook events (for testing webhook handlers)
   */
  http.post('*/webhooks/clerk', async ({ request }) => {
    const body = await request.json() as any
    
    // Echo back the webhook event for testing
    return HttpResponse.json({
      received: true,
      event_type: body.type,
      timestamp: Date.now()
    })
  })
]

/**
 * Helper functions for test scenarios
 */
export const clerkMockHelpers = {
  /**
   * Create a mock user with custom properties
   */
  mockUser: (overrides: Partial<typeof DEFAULT_MOCK_USER> = {}) => ({
    ...DEFAULT_MOCK_USER,
    ...overrides
  }),

  /**
   * Mock an unauthorized response
   */
  mockUnauthorized: () => {
    return http.get('*/v1/me', () => {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    })
  },

  /**
   * Mock a user not found response
   */
  mockUserNotFound: () => {
    return http.get('*/v1/me', () => {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    })
  }
}