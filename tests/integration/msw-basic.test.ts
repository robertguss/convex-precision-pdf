import { describe, it, expect } from 'vitest'

/**
 * Basic MSW integration test to verify setup is working
 */
describe('MSW Basic Setup', () => {
  it('should intercept basic API calls', async () => {
    // This should be intercepted by our default handlers
    const response = await fetch('/v1/me', {
      headers: {
        'Authorization': 'Bearer test_token'
      }
    })

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.id).toBe('user_test123')
  })

  it('should handle unauthorized requests', async () => {
    const response = await fetch('/v1/me')
    expect(response.status).toBe(401)
  })
})