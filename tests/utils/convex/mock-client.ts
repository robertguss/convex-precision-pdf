import { ConvexClient } from 'convex/browser'
import { vi } from 'vitest'

/**
 * Mock Convex client for testing components that use Convex hooks.
 * Provides controllable mock behavior for queries, mutations, and actions.
 */
export class MockConvexClient extends ConvexClient {
  private mockData: Map<string, any> = new Map()
  private subscriptions: Map<string, Function> = new Map()
  
  constructor() {
    super('https://mock.convex.cloud')
  }
  
  query = vi.fn(async (query: any, args?: any) => {
    const key = `${query._name}:${JSON.stringify(args)}`
    return this.mockData.get(key) || null
  })
  
  mutation = vi.fn(async (mutation: any, args?: any) => {
    return { _id: 'mock_id_' + Date.now() }
  })
  
  action = vi.fn(async (action: any, args?: any) => {
    return { success: true }
  })
  
  // Mock subscription behavior
  onUpdate = vi.fn((query: any, args: any, callback: Function) => {
    const key = `${query._name}:${JSON.stringify(args)}`
    this.subscriptions.set(key, callback)
    
    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(key)
    }
  })
  
  /**
   * Set mock data for a specific query
   */
  setMockData(query: any, args: any, data: any) {
    const key = `${query._name}:${JSON.stringify(args)}`
    this.mockData.set(key, data)
    
    // Trigger subscription callbacks
    const callback = this.subscriptions.get(key)
    if (callback) {
      callback(data)
    }
  }
  
  /**
   * Trigger an update for subscribers
   */
  triggerUpdate(query: any, args: any, data: any) {
    const key = `${query._name}:${JSON.stringify(args)}`
    const callback = this.subscriptions.get(key)
    if (callback) {
      callback(data)
    }
  }
  
  /**
   * Reset all mock state
   */
  reset() {
    this.mockData.clear()
    this.subscriptions.clear()
    this.query.mockClear()
    this.mutation.mockClear()
    this.action.mockClear()
  }
}

/**
 * Create a new mock Convex client instance
 */
export function createMockConvexClient(): MockConvexClient {
  return new MockConvexClient()
}