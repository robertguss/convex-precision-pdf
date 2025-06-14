import { vi } from 'vitest'
import { createConvexTest } from './setup'

/**
 * Helper to test real-time subscription behavior
 */
export class RealtimeTestHelper {
  private subscriptions: Map<string, Function[]> = new Map()
  private mockClient: any

  constructor(mockClient?: any) {
    this.mockClient = mockClient
  }

  /**
   * Subscribe to updates for a specific query
   */
  subscribe(queryName: string, args: any, callback: Function): () => void {
    const key = `${queryName}:${JSON.stringify(args)}`
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, [])
    }
    
    this.subscriptions.get(key)!.push(callback)
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(key)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * Trigger an update for all subscribers of a query
   */
  triggerUpdate(queryName: string, args: any, data: any) {
    const key = `${queryName}:${JSON.stringify(args)}`
    const callbacks = this.subscriptions.get(key) || []
    
    callbacks.forEach(callback => {
      callback(data)
    })
    
    // Also trigger on mock client if provided
    if (this.mockClient && this.mockClient.triggerUpdate) {
      this.mockClient.triggerUpdate({ _name: queryName }, args, data)
    }
  }

  /**
   * Clear all subscriptions
   */
  clearSubscriptions() {
    this.subscriptions.clear()
  }

  /**
   * Get current subscription count for a query
   */
  getSubscriptionCount(queryName: string, args: any): number {
    const key = `${queryName}:${JSON.stringify(args)}`
    return this.subscriptions.get(key)?.length || 0
  }
}

/**
 * Helper to test document processing real-time updates
 */
export const createDocumentProcessingSimulator = (helper: RealtimeTestHelper) => {
  return {
    /**
     * Simulate document processing progress updates
     */
    async simulateProcessing(documentId: string, steps: number = 5) {
      const progressSteps = Array.from({ length: steps }, (_, i) => ({
        status: i === steps - 1 ? 'completed' : 'processing',
        progress: Math.round(((i + 1) / steps) * 100),
      }))

      for (const [index, step] of progressSteps.entries()) {
        await new Promise(resolve => setTimeout(resolve, 100)) // Small delay
        
        helper.triggerUpdate('documentProcessing.get', { documentId }, {
          _id: documentId,
          ...step,
          chunks: step.status === 'completed' ? ['chunk1', 'chunk2'] : [],
        })
      }
    },

    /**
     * Simulate processing failure
     */
    simulateFailure(documentId: string, error: string = 'Processing failed') {
      helper.triggerUpdate('documentProcessing.get', { documentId }, {
        _id: documentId,
        status: 'failed',
        progress: 0,
        error,
        chunks: [],
      })
    },
  }
}

/**
 * Helper to test subscription/credit real-time updates
 */
export const createSubscriptionSimulator = (helper: RealtimeTestHelper) => {
  return {
    /**
     * Simulate credit usage update
     */
    updateCredits(userId: string, newCredits: number, creditsUsed: number = 0) {
      helper.triggerUpdate('subscriptions.getUserSubscription', { userId }, {
        _id: `sub_${userId}`,
        userId,
        credits: newCredits,
        creditsUsed,
        tier: newCredits > 100 ? 'business' : newCredits > 10 ? 'pro' : 'free',
      })
    },

    /**
     * Simulate subscription tier change
     */
    changeTier(userId: string, newTier: 'free' | 'pro' | 'business') {
      const credits = newTier === 'free' ? 10 : newTier === 'pro' ? 100 : 1000
      
      helper.triggerUpdate('subscriptions.getUserSubscription', { userId }, {
        _id: `sub_${userId}`,
        userId,
        tier: newTier,
        credits,
        creditsUsed: 0,
        isActive: newTier !== 'free',
      })
    },

    /**
     * Simulate subscription expiry
     */
    expireSubscription(userId: string) {
      helper.triggerUpdate('subscriptions.getUserSubscription', { userId }, {
        _id: `sub_${userId}`,
        userId,
        tier: 'free',
        credits: 10,
        creditsUsed: 0,
        isActive: false,
        status: 'expired',
      })
    },
  }
}

/**
 * Wait for real-time update with timeout
 */
export const waitForRealtimeUpdate = async (
  helper: RealtimeTestHelper,
  queryName: string,
  args: any,
  predicate: (data: any) => boolean,
  timeout: number = 5000
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      unsubscribe()
      reject(new Error(`Timeout waiting for realtime update: ${queryName}`))
    }, timeout)

    const unsubscribe = helper.subscribe(queryName, args, (data: any) => {
      if (predicate(data)) {
        clearTimeout(timeoutId)
        unsubscribe()
        resolve(data)
      }
    })
  })
}

/**
 * Test utility to verify subscription cleanup
 */
export const testSubscriptionCleanup = async (
  component: any,
  expectedSubscriptions: Array<{ queryName: string; args: any }>
) => {
  const helper = new RealtimeTestHelper()
  
  // Track subscriptions
  const subscriptionCounts = new Map<string, number>()
  
  expectedSubscriptions.forEach(({ queryName, args }) => {
    const key = `${queryName}:${JSON.stringify(args)}`
    subscriptionCounts.set(key, 0)
  })

  // Mock useQuery to track subscriptions
  vi.mock('convex/react', () => ({
    useQuery: vi.fn((query, args) => {
      const key = `${query._name}:${JSON.stringify(args)}`
      const currentCount = subscriptionCounts.get(key) || 0
      subscriptionCounts.set(key, currentCount + 1)
      
      return { data: null, isLoading: false }
    }),
  }))

  return {
    helper,
    getSubscriptionCounts: () => subscriptionCounts,
  }
}