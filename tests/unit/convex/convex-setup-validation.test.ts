import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  MockConvexClient,
  createMockConvexClient,
  createConvexTest,
  createConvexTestWithAuth,
  createMockUserIdentity,
  withAuthenticatedUser,
  withUnauthenticatedUser,
  RealtimeTestHelper,
} from '../../utils/convex'

describe('Convex Test Utilities Setup Validation', () => {
  describe('MockConvexClient', () => {
    let mockClient: MockConvexClient

    beforeEach(() => {
      mockClient = createMockConvexClient()
    })

    it('should create a mock client', () => {
      expect(mockClient).toBeInstanceOf(MockConvexClient)
      expect(mockClient.query).toBeDefined()
      expect(mockClient.mutation).toBeDefined()
      expect(mockClient.action).toBeDefined()
    })

    it('should handle mock queries', async () => {
      const mockQuery = { _name: 'test.query' }
      const mockArgs = { id: '123' }
      const mockData = { result: 'test data' }

      mockClient.setMockData(mockQuery, mockArgs, mockData)
      const result = await mockClient.query(mockQuery, mockArgs)

      expect(result).toEqual(mockData)
      expect(mockClient.query).toHaveBeenCalledWith(mockQuery, mockArgs)
    })

    it('should handle mock mutations', async () => {
      const mockMutation = { _name: 'test.mutation' }
      const result = await mockClient.mutation(mockMutation, {})

      expect(result).toHaveProperty('_id')
      expect(result._id).toMatch(/^mock_id_\d+$/)
    })

    it('should handle subscriptions', () => {
      const mockQuery = { _name: 'test.subscription' }
      const mockArgs = { userId: '123' }
      const callback = vi.fn()

      const unsubscribe = mockClient.onUpdate(mockQuery, mockArgs, callback)
      
      expect(typeof unsubscribe).toBe('function')
      expect(mockClient.onUpdate).toHaveBeenCalled()

      // Test triggering update
      const updateData = { updated: true }
      mockClient.triggerUpdate(mockQuery, mockArgs, updateData)
      expect(callback).toHaveBeenCalledWith(updateData)

      // Test unsubscribe
      unsubscribe()
      mockClient.triggerUpdate(mockQuery, mockArgs, { another: 'update' })
      expect(callback).toHaveBeenCalledTimes(1) // Should not be called again
    })

    it('should reset properly', () => {
      const mockQuery = { _name: 'test.query' }
      mockClient.setMockData(mockQuery, {}, { data: 'test' })
      
      mockClient.reset()
      
      expect(mockClient.query).not.toHaveBeenCalled()
      expect(mockClient.mutation).not.toHaveBeenCalled()
      expect(mockClient.action).not.toHaveBeenCalled()
    })
  })

  describe('Convex Test Setup', () => {
    it('should create a convex test instance', () => {
      const t = createConvexTest()
      expect(t).toBeDefined()
    })

    it('should create convex test with auth', () => {
      const t = createConvexTestWithAuth('test-user-123')
      expect(t).toBeDefined()
    })
  })

  describe('Auth Helpers', () => {
    it('should create mock user identity', () => {
      const identity = createMockUserIdentity()
      
      expect(identity).toHaveProperty('subject')
      expect(identity).toHaveProperty('issuer')
      expect(identity).toHaveProperty('tokenIdentifier')
      expect(identity.subject).toBe('test-user-id')
      expect(identity.issuer).toBe('https://clerk.test')
    })

    it('should create mock user identity with overrides', () => {
      const identity = createMockUserIdentity({
        subject: 'custom-user-id',
        name: 'Custom User',
      })
      
      expect(identity.subject).toBe('custom-user-id')
      expect(identity.name).toBe('Custom User')
      expect(identity.issuer).toBe('https://clerk.test') // Should keep default
    })

    it('should test with authenticated user', async () => {
      const userIdentity = createMockUserIdentity({ subject: 'auth-test-user' })
      
      const result = await withAuthenticatedUser(userIdentity, async (t) => {
        // This would typically test an authenticated function
        return 'authenticated test passed'
      })
      
      expect(result).toBe('authenticated test passed')
    })

    it('should test with unauthenticated user', async () => {
      const result = await withUnauthenticatedUser(async (t) => {
        // This would typically test an unauthenticated scenario
        return 'unauthenticated test passed'
      })
      
      expect(result).toBe('unauthenticated test passed')
    })
  })

  describe('Realtime Helpers', () => {
    let realtimeHelper: RealtimeTestHelper

    beforeEach(() => {
      realtimeHelper = new RealtimeTestHelper()
    })

    it('should handle subscriptions', () => {
      const callback = vi.fn()
      const unsubscribe = realtimeHelper.subscribe('test.query', { id: '123' }, callback)
      
      expect(typeof unsubscribe).toBe('function')
      expect(realtimeHelper.getSubscriptionCount('test.query', { id: '123' })).toBe(1)
    })

    it('should trigger updates', () => {
      const callback = vi.fn()
      realtimeHelper.subscribe('test.query', { id: '123' }, callback)
      
      const updateData = { updated: 'data' }
      realtimeHelper.triggerUpdate('test.query', { id: '123' }, updateData)
      
      expect(callback).toHaveBeenCalledWith(updateData)
    })

    it('should handle unsubscribe', () => {
      const callback = vi.fn()
      const unsubscribe = realtimeHelper.subscribe('test.query', { id: '123' }, callback)
      
      unsubscribe()
      realtimeHelper.triggerUpdate('test.query', { id: '123' }, { data: 'test' })
      
      expect(callback).not.toHaveBeenCalled()
      expect(realtimeHelper.getSubscriptionCount('test.query', { id: '123' })).toBe(0)
    })

    it('should clear all subscriptions', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      realtimeHelper.subscribe('query1', {}, callback1)
      realtimeHelper.subscribe('query2', {}, callback2)
      
      realtimeHelper.clearSubscriptions()
      
      expect(realtimeHelper.getSubscriptionCount('query1', {})).toBe(0)
      expect(realtimeHelper.getSubscriptionCount('query2', {})).toBe(0)
    })
  })
})