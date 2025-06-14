/**
 * Mock data generators for testing
 * Provides factory functions for creating test data
 */

import { Id } from '@/convex/_generated/dataModel';
import { faker } from '@faker-js/faker';

/**
 * Mock user generator
 */
export const mockUsers = {
  generateMockUser: (overrides: any = {}) => ({
    _id: faker.string.uuid() as Id<'users'>,
    tokenIdentifier: `clerk|${faker.string.uuid()}`,
    email: faker.internet.email(),
    name: faker.person.fullName(),
    subscriptionId: faker.string.uuid() as Id<'subscriptions'>,
    stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides
  })
};

/**
 * Mock document generator
 */
export const mockDocuments = {
  generateMockDocument: (overrides: any = {}) => ({
    _id: faker.string.uuid() as Id<'documents'>,
    userId: faker.string.uuid() as Id<'users'>,
    title: faker.system.fileName(),
    status: 'processing' as const,
    fileId: faker.string.uuid() as Id<'_storage'>,
    fileSize: faker.number.int({ min: 1024, max: 10485760 }),
    mimeType: faker.helpers.arrayElement(['application/pdf', 'image/png', 'image/jpeg']),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides
  })
};

/**
 * Mock subscription generator
 */
export const mockSubscriptions = {
  generateMockSubscription: (overrides: any = {}) => ({
    _id: faker.string.uuid() as Id<'subscriptions'>,
    userId: faker.string.uuid() as Id<'users'>,
    plan: faker.helpers.arrayElement(['free', 'pro', 'business'] as const),
    status: 'active' as const,
    pageLimit: 100,
    pagesUsed: faker.number.int({ min: 0, max: 50 }),
    stripeSubscriptionId: `sub_${faker.string.alphanumeric(24)}`,
    stripePriceId: `price_${faker.string.alphanumeric(24)}`,
    stripeCurrentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides
  })
};

/**
 * Mock chunk generator
 */
export const mockChunks = {
  generateMockChunk: (overrides: any = {}) => ({
    chunk_id: faker.string.uuid(),
    content: faker.lorem.paragraph(),
    page: faker.number.int({ min: 0, max: 10 }),
    bbox: {
      x: faker.number.float({ min: 0, max: 100 }),
      y: faker.number.float({ min: 0, max: 100 }),
      width: faker.number.float({ min: 50, max: 200 }),
      height: faker.number.float({ min: 20, max: 100 })
    },
    metadata: {
      chunk_type: faker.helpers.arrayElement(['text', 'title', 'list']),
      confidence: faker.number.float({ min: 0.8, max: 1 })
    },
    ...overrides
  }),

  generateMockChunks: (count: number = 5) => {
    return Array.from({ length: count }, (_, i) => 
      mockChunks.generateMockChunk({
        chunk_id: `chunk-${i}`,
        page: Math.floor(i / 2)
      })
    );
  }
};

/**
 * Mock page usage generator
 */
export const mockPageUsage = {
  generateMockPageUsage: (overrides: any = {}) => ({
    _id: faker.string.uuid() as Id<'pageUsage'>,
    userId: faker.string.uuid() as Id<'users'>,
    documentId: faker.string.uuid() as Id<'documents'>,
    pageCount: faker.number.int({ min: 1, max: 50 }),
    createdAt: Date.now(),
    ...overrides
  })
};

/**
 * Mock Stripe objects generators
 */
export const mockStripeObjects = {
  generateMockStripeCustomer: (overrides: any = {}) => ({
    id: `cus_${faker.string.alphanumeric(14)}`,
    object: 'customer',
    email: faker.internet.email(),
    name: faker.person.fullName(),
    metadata: {
      userId: faker.string.uuid()
    },
    created: Math.floor(Date.now() / 1000),
    ...overrides
  }),

  generateMockStripeSubscription: (overrides: any = {}) => ({
    id: `sub_${faker.string.alphanumeric(24)}`,
    object: 'subscription',
    customer: `cus_${faker.string.alphanumeric(14)}`,
    status: faker.helpers.arrayElement(['active', 'past_due', 'canceled']),
    current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
    items: {
      data: [{
        price: {
          id: `price_${faker.string.alphanumeric(24)}`,
          product: `prod_${faker.string.alphanumeric(14)}`,
          unit_amount: faker.helpers.arrayElement([1900, 3900]),
          currency: 'usd'
        }
      }]
    },
    metadata: {
      userId: faker.string.uuid()
    },
    ...overrides
  }),

  generateMockStripeInvoice: (overrides: any = {}) => ({
    id: `in_${faker.string.alphanumeric(24)}`,
    object: 'invoice',
    customer: `cus_${faker.string.alphanumeric(14)}`,
    subscription: `sub_${faker.string.alphanumeric(24)}`,
    status: faker.helpers.arrayElement(['paid', 'open', 'uncollectible']),
    amount_paid: faker.number.int({ min: 1900, max: 3900 }),
    amount_due: 0,
    currency: 'usd',
    period_start: Math.floor(Date.now() / 1000),
    period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
    ...overrides
  }),

  generateMockStripeCheckoutSession: (overrides: any = {}) => ({
    id: `cs_${faker.string.alphanumeric(24)}`,
    object: 'checkout.session',
    customer: `cus_${faker.string.alphanumeric(14)}`,
    payment_status: 'paid',
    status: 'complete',
    mode: 'subscription',
    subscription: `sub_${faker.string.alphanumeric(24)}`,
    metadata: {
      userId: faker.string.uuid()
    },
    ...overrides
  })
};

/**
 * Mock example data generator
 */
export const mockExamples = {
  generateMockExample: (overrides: any = {}) => ({
    title: faker.lorem.words(3),
    dataUrl: `/examples/${faker.system.fileName({ extension: 'json' })}`,
    staticImageBasePath: `/examples/${faker.system.fileName()}-images`,
    pageCount: faker.number.int({ min: 1, max: 10 }),
    ...overrides
  })
};

/**
 * Mock document data (processed content)
 */
export const mockDocData = {
  generateMockDocData: (overrides: any = {}) => ({
    markdown: faker.lorem.paragraphs(3, '\n\n'),
    chunks: mockChunks.generateMockChunks(faker.number.int({ min: 5, max: 15 })),
    errors: [],
    num_pages: faker.number.int({ min: 1, max: 20 }),
    ...overrides
  })
};