import { convexTest } from 'convex-test'
import { vi } from 'vitest'

export { ConvexTestingHelper } from './testing-helper'

/**
 * Create a test instance of Convex with isolated state
 * Note: This will require proper Convex schema setup to work fully
 */
export const createConvexTest = () => {
  // For now, return a basic test instance
  // In a real scenario, you would import modules from convex/_generated/test
  try {
    // Dynamically import the modules if they exist
    const modules = require('../../../convex/_generated/test')
    return convexTest(modules)
  } catch (error) {
    // Fallback for development/testing when modules aren't generated
    console.warn('Convex test modules not found. Using mock test instance.')
    return {
      query: vi.fn(),
      mutation: vi.fn(),
      action: vi.fn(),
      withIdentity: vi.fn().mockReturnThis(),
    }
  }
}

/**
 * Helper to create a test with authenticated user context
 */
export const createConvexTestWithAuth = (userId: string = 'test-user-id') => {
  const t = createConvexTest()
  
  // Mock authentication
  t.withIdentity({
    subject: userId,
    issuer: 'https://clerk.test',
    tokenIdentifier: `test-token-${userId}`,
  })
  
  return t
}

/**
 * Helper to seed test data in Convex
 * Note: This is a template - actual implementation depends on your Convex schema
 */
export const seedTestData = async (t: ReturnType<typeof createConvexTest>) => {
  try {
    // Try to import the API if it exists
    const { api } = await import('../../../convex/_generated/api')
    
    // Seed basic test data
    const testUser = await t.mutation(api.users.create, {
      email: 'test@example.com',
      name: 'Test User',
      clerkId: 'test-user-id',
    })
    
    const testDocument = await t.mutation(api.documents.create, {
      title: 'Test Document',
      filename: 'test.pdf',
      fileSize: 1024,
      uploaderId: testUser,
    })
    
    return {
      testUser,
      testDocument,
    }
  } catch (error) {
    console.warn('Could not seed test data - API not available')
    return {
      testUser: 'mock-user-id',
      testDocument: 'mock-document-id',
    }
  }
}

/**
 * Helper to create test subscription data
 * Note: This is a template - actual implementation depends on your Convex schema
 */
export const createTestSubscription = async (
  t: ReturnType<typeof createConvexTest>,
  userId: string,
  tier: 'free' | 'pro' | 'business' = 'free'
) => {
  try {
    const { api } = await import('../../../convex/_generated/api')
    return await t.mutation(api.subscriptions.create, {
      userId,
      tier,
      credits: tier === 'free' ? 10 : tier === 'pro' ? 100 : 1000,
      stripeCustomerId: `cus_test_${userId}`,
      stripeSubscriptionId: tier !== 'free' ? `sub_test_${userId}` : undefined,
    })
  } catch (error) {
    console.warn('Could not create test subscription - API not available')
    return `mock-subscription-${userId}`
  }
}

/**
 * Helper to create test document processing data
 * Note: This is a template - actual implementation depends on your Convex schema
 */
export const createTestDocumentProcessing = async (
  t: ReturnType<typeof createConvexTest>,
  documentId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending'
) => {
  try {
    const { api } = await import('../../../convex/_generated/api')
    return await t.mutation(api.documentProcessing.create, {
      documentId,
      status,
      progress: status === 'completed' ? 100 : status === 'processing' ? 50 : 0,
      chunks: status === 'completed' ? ['chunk1', 'chunk2'] : [],
    })
  } catch (error) {
    console.warn('Could not create test document processing - API not available')
    return `mock-processing-${documentId}`
  }
}