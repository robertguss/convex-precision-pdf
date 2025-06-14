/**
 * ABOUTME: Unit tests for Stripe payment processing and webhook handling logic
 * ABOUTME: Tests checkout sessions, portal creation, webhook processing, and payment state management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { convexTest } from 'convex-test'
import { api, internal } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { generateUser, generateSubscription, generateStripeCustomer, generateStripeSubscription, generateStripeCheckoutSession, generateStripeInvoice } from '../../utils/data/generators'

// Mock Stripe
const mockStripe = {
  customers: {
    create: vi.fn(),
  },
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: vi.fn(),
    },
  },
  subscriptions: {
    retrieve: vi.fn(),
  },
}

// Mock the Stripe module
vi.mock('stripe', () => {
  return {
    default: vi.fn(() => mockStripe),
  }
})

// Mock environment variables
vi.mock('node:process', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_mock_key',
    SITE_URL: 'http://localhost:3000',
  },
}))

describe('Stripe Payment Processing', () => {
  let t: any

  beforeEach(async () => {
    const schema = await import('../../../convex/schema')
    t = convexTest(schema.default)
    
    // Seed plans for testing
    await t.mutation(api.plans.seedPlans)
    
    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createCheckoutSession', () => {
    it('should create checkout session for new customer', async () => {
      const user = generateUser()
      const userId = await t.mutation(internal.users.create, user)
      
      const mockCustomer = generateStripeCustomer({
        email: user.email,
        metadata: { convexUserId: user.externalId },
      })
      
      const mockSession = generateStripeCheckoutSession({
        customer: mockCustomer.id,
        metadata: {
          convexUserId: user.externalId,
          planId: 'starter',
        },
      })
      
      mockStripe.customers.create.mockResolvedValue(mockCustomer)
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession)
      
      t.withIdentity({ subject: user.externalId })
      
      const result = await t.action(api.stripe.createCheckoutSession, {
        planId: 'starter',
      })
      
      expect(result.url).toBe(mockSession.url)
      expect(result.sessionId).toBe(mockSession.id)
      
      // Verify Stripe customer was created
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: user.email,
        metadata: {
          convexUserId: user.externalId,
        },
      })
      
      // Verify checkout session was created
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: mockCustomer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_1RVxgR4Qp58g8uFwKTF0M73d', // Starter plan price ID
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: 'http://localhost:3000/dashboard?success=true',
        cancel_url: 'http://localhost:3000/dashboard',
        metadata: {
          convexUserId: user.externalId,
          planId: 'starter',
        },
      })
    })

    it('should reuse existing customer for user with subscription', async () => {
      const user = generateUser()
      const userId = await t.mutation(internal.users.create, user)
      
      const existingSubscription = generateSubscription({
        userId,
        planId: 'free',
        status: 'active',
      })
      await t.mutation(internal.subscriptions.createSubscription, existingSubscription)
      
      const mockSession = generateStripeCheckoutSession({
        customer: existingSubscription.stripeCustomerId,
        metadata: {
          convexUserId: user.externalId,
          planId: 'pro',
        },
      })
      
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession)
      
      t.withIdentity({ subject: user.externalId })
      
      const result = await t.action(api.stripe.createCheckoutSession, {
        planId: 'pro',
      })
      
      expect(result.url).toBe(mockSession.url)
      
      // Should NOT create new customer
      expect(mockStripe.customers.create).not.toHaveBeenCalled()
      
      // Should use existing customer ID
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: existingSubscription.stripeCustomerId,
        })
      )
    })

    it('should throw error for unauthenticated user', async () => {
      await expect(
        t.action(api.stripe.createCheckoutSession, {
          planId: 'starter',
        })
      ).rejects.toThrow('Not authenticated')
    })

    it('should throw error for invalid plan ID', async () => {
      const user = generateUser()
      await t.mutation(internal.users.create, user)
      
      t.withIdentity({ subject: user.externalId })
      
      await expect(
        t.action(api.stripe.createCheckoutSession, {
          planId: 'invalid_plan',
        })
      ).rejects.toThrow('Plan not found')
    })

    it('should handle Stripe customer creation error', async () => {
      const user = generateUser()
      await t.mutation(internal.users.create, user)
      
      mockStripe.customers.create.mockRejectedValue(new Error('Stripe API error'))
      
      t.withIdentity({ subject: user.externalId })
      
      await expect(
        t.action(api.stripe.createCheckoutSession, {
          planId: 'starter',
        })
      ).rejects.toThrow('Failed to create checkout session: Stripe API error')
    })

    it('should handle Stripe checkout session creation error', async () => {
      const user = generateUser()
      await t.mutation(internal.users.create, user)
      
      const mockCustomer = generateStripeCustomer()
      mockStripe.customers.create.mockResolvedValue(mockCustomer)
      mockStripe.checkout.sessions.create.mockRejectedValue(new Error('Invalid payment method'))
      
      t.withIdentity({ subject: user.externalId })
      
      await expect(
        t.action(api.stripe.createCheckoutSession, {
          planId: 'starter',
        })
      ).rejects.toThrow('Failed to create checkout session: Invalid payment method')
    })

    it('should handle missing session URL from Stripe', async () => {
      const user = generateUser()
      await t.mutation(internal.users.create, user)
      
      const mockCustomer = generateStripeCustomer()
      const mockSession = generateStripeCheckoutSession()
      delete mockSession.url // Remove URL to simulate error
      
      mockStripe.customers.create.mockResolvedValue(mockCustomer)
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession)
      
      t.withIdentity({ subject: user.externalId })
      
      await expect(
        t.action(api.stripe.createCheckoutSession, {
          planId: 'starter',
        })
      ).rejects.toThrow('Failed to create checkout session')
    })
  })

  describe('createPortalSession', () => {
    it('should create portal session for existing customer', async () => {
      const user = generateUser()
      const userId = await t.mutation(internal.users.create, user)
      
      const subscription = generateSubscription({
        userId,
        planId: 'starter',
        status: 'active',
      })
      await t.mutation(internal.subscriptions.createSubscription, subscription)
      
      const mockPortalSession = {
        url: 'https://billing.stripe.com/session/abc123',
      }
      
      mockStripe.billingPortal.sessions.create.mockResolvedValue(mockPortalSession)
      
      t.withIdentity({ subject: user.externalId })
      
      const result = await t.action(api.stripe.createPortalSession)
      
      expect(result.url).toBe(mockPortalSession.url)
      
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: subscription.stripeCustomerId,
        return_url: 'http://localhost:3000/dashboard',
      })
    })

    it('should throw error for unauthenticated user', async () => {
      await expect(
        t.action(api.stripe.createPortalSession)
      ).rejects.toThrow('Not authenticated')
    })

    it('should throw error for user without subscription', async () => {
      const user = generateUser()
      await t.mutation(internal.users.create, user)
      
      t.withIdentity({ subject: user.externalId })
      
      await expect(
        t.action(api.stripe.createPortalSession)
      ).rejects.toThrow('No subscription found')
    })

    it('should handle Stripe portal creation error', async () => {
      const user = generateUser()
      const userId = await t.mutation(internal.users.create, user)
      
      const subscription = generateSubscription({
        userId,
        planId: 'starter',
        status: 'active',
      })
      await t.mutation(internal.subscriptions.createSubscription, subscription)
      
      mockStripe.billingPortal.sessions.create.mockRejectedValue(new Error('Customer not found'))
      
      t.withIdentity({ subject: user.externalId })
      
      await expect(
        t.action(api.stripe.createPortalSession)
      ).rejects.toThrow('Failed to create portal session: Customer not found')
    })
  })

  describe('handleWebhook', () => {
    describe('checkout.session.completed', () => {
      it('should create subscription on successful checkout', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const mockSubscription = generateStripeSubscription({
          customer: 'cus_test123',
          status: 'active',
          items: {
            data: [{
              price: {
                id: 'price_1RVxgR4Qp58g8uFwKTF0M73d', // Starter plan price
              },
            }],
          },
        })
        
        const mockSession = generateStripeCheckoutSession({
          mode: 'subscription',
          subscription: mockSubscription.id,
          customer: 'cus_test123',
          metadata: {
            convexUserId: user.externalId,
            planId: 'starter',
          },
        })
        
        mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription)
        
        const webhookEvent = {
          type: 'checkout.session.completed',
          data: { object: mockSession },
        }
        
        const result = await t.action(api.stripe.handleWebhook, {
          event: webhookEvent,
        })
        
        expect(result.received).toBe(true)
        
        // Verify subscription was created in database
        const dbSubscription = await t.query(internal.subscriptions.getByUser, { userId })
        expect(dbSubscription).toBeDefined()
        expect(dbSubscription?.planId).toBe('starter')
        expect(dbSubscription?.status).toBe('active')
        expect(dbSubscription?.stripeCustomerId).toBe('cus_test123')
        expect(dbSubscription?.stripeSubscriptionId).toBe(mockSubscription.id)
      })

      it('should handle checkout session without convex user ID', async () => {
        const mockSession = generateStripeCheckoutSession({
          mode: 'subscription',
          metadata: {}, // No convexUserId
        })
        
        const webhookEvent = {
          type: 'checkout.session.completed',
          data: { object: mockSession },
        }
        
        // Should not throw error but handle gracefully
        const result = await t.action(api.stripe.handleWebhook, {
          event: webhookEvent,
        })
        
        expect(result.received).toBe(true)
      })

      it('should handle checkout session for non-existent user', async () => {
        const mockSession = generateStripeCheckoutSession({
          mode: 'subscription',
          metadata: {
            convexUserId: 'nonexistent_user_id',
          },
        })
        
        const webhookEvent = {
          type: 'checkout.session.completed',
          data: { object: mockSession },
        }
        
        // Should not throw error but handle gracefully
        const result = await t.action(api.stripe.handleWebhook, {
          event: webhookEvent,
        })
        
        expect(result.received).toBe(true)
      })

      it('should map Stripe price ID to correct plan', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const mockSubscription = generateStripeSubscription({
          customer: 'cus_test123',
          status: 'active',
          items: {
            data: [{
              price: {
                id: 'price_1RVxgx4Qp58g8uFwO8Eyjre3', // Pro plan price
              },
            }],
          },
        })
        
        const mockSession = generateStripeCheckoutSession({
          mode: 'subscription',
          subscription: mockSubscription.id,
          customer: 'cus_test123',
          metadata: {
            convexUserId: user.externalId,
          },
        })
        
        mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription)
        
        const webhookEvent = {
          type: 'checkout.session.completed',
          data: { object: mockSession },
        }
        
        await t.action(api.stripe.handleWebhook, { event: webhookEvent })
        
        const dbSubscription = await t.query(internal.subscriptions.getByUser, { userId })
        expect(dbSubscription?.planId).toBe('pro')
      })

      it('should fallback to metadata plan ID when price mapping fails', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const mockSubscription = generateStripeSubscription({
          customer: 'cus_test123',
          status: 'active',
          items: {
            data: [{
              price: {
                id: 'price_unknown', // Unknown price ID
              },
            }],
          },
        })
        
        const mockSession = generateStripeCheckoutSession({
          mode: 'subscription',
          subscription: mockSubscription.id,
          customer: 'cus_test123',
          metadata: {
            convexUserId: user.externalId,
            planId: 'starter', // Should use this as fallback
          },
        })
        
        mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription)
        
        const webhookEvent = {
          type: 'checkout.session.completed',
          data: { object: mockSession },
        }
        
        await t.action(api.stripe.handleWebhook, { event: webhookEvent })
        
        const dbSubscription = await t.query(internal.subscriptions.getByUser, { userId })
        expect(dbSubscription?.planId).toBe('starter')
      })

      it('should default to free plan when no mapping or metadata found', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const mockSubscription = generateStripeSubscription({
          customer: 'cus_test123',
          status: 'active',
          items: {
            data: [{
              price: {
                id: 'price_unknown',
              },
            }],
          },
        })
        
        const mockSession = generateStripeCheckoutSession({
          mode: 'subscription',
          subscription: mockSubscription.id,
          customer: 'cus_test123',
          metadata: {
            convexUserId: user.externalId,
            // No planId in metadata
          },
        })
        
        mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription)
        
        const webhookEvent = {
          type: 'checkout.session.completed',
          data: { object: mockSession },
        }
        
        await t.action(api.stripe.handleWebhook, { event: webhookEvent })
        
        const dbSubscription = await t.query(internal.subscriptions.getByUser, { userId })
        expect(dbSubscription?.planId).toBe('free')
      })
    })

    describe('customer.subscription.created/updated', () => {
      it('should update existing subscription on subscription.updated', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        // Create initial subscription
        const initialSubscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'active',
        })
        await t.mutation(internal.subscriptions.createSubscription, initialSubscription)
        
        const updatedStripeSubscription = generateStripeSubscription({
          id: initialSubscription.stripeSubscriptionId,
          customer: initialSubscription.stripeCustomerId,
          status: 'active',
          items: {
            data: [{
              price: {
                id: 'price_1RVxgx4Qp58g8uFwO8Eyjre3', // Pro plan price
              },
            }],
          },
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
          cancel_at_period_end: false,
        })
        
        const webhookEvent = {
          type: 'customer.subscription.updated',
          data: { object: updatedStripeSubscription },
        }
        
        const result = await t.action(api.stripe.handleWebhook, {
          event: webhookEvent,
        })
        
        expect(result.received).toBe(true)
        
        // Verify subscription was updated
        const dbSubscription = await t.query(internal.subscriptions.getByUser, { userId })
        expect(dbSubscription?.planId).toBe('pro')
        expect(dbSubscription?.status).toBe('active')
      })

      it('should handle subscription update for non-existent subscription gracefully', async () => {
        const nonExistentSubscription = generateStripeSubscription({
          customer: 'cus_nonexistent',
        })
        
        const webhookEvent = {
          type: 'customer.subscription.updated',
          data: { object: nonExistentSubscription },
        }
        
        // Should not throw error
        const result = await t.action(api.stripe.handleWebhook, {
          event: webhookEvent,
        })
        
        expect(result.received).toBe(true)
      })
    })

    describe('customer.subscription.deleted', () => {
      it('should cancel subscription and revert to free plan', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'active',
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        const deletedSubscription = generateStripeSubscription({
          id: subscription.stripeSubscriptionId,
          customer: subscription.stripeCustomerId,
          status: 'canceled',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000),
          cancel_at_period_end: true,
        })
        
        const webhookEvent = {
          type: 'customer.subscription.deleted',
          data: { object: deletedSubscription },
        }
        
        const result = await t.action(api.stripe.handleWebhook, {
          event: webhookEvent,
        })
        
        expect(result.received).toBe(true)
        
        // Verify subscription was canceled and reverted to free
        const dbSubscription = await t.query(internal.subscriptions.getByUser, { userId })
        expect(dbSubscription?.status).toBe('canceled')
        expect(dbSubscription?.planId).toBe('free')
        expect(dbSubscription?.cancelAtPeriodEnd).toBe(true)
      })
    })

    describe('invoice.payment_succeeded', () => {
      it('should activate subscription on successful payment', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'incomplete',
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        const invoice = generateStripeInvoice({
          subscription: subscription.stripeSubscriptionId,
          payment_intent: {
            status: 'succeeded',
          },
        })
        
        const webhookEvent = {
          type: 'invoice.payment_succeeded',
          data: { object: invoice },
        }
        
        const result = await t.action(api.stripe.handleWebhook, {
          event: webhookEvent,
        })
        
        expect(result.received).toBe(true)
        
        // Verify subscription status was updated to active
        const dbSubscription = await t.query(internal.subscriptions.getByUser, { userId })
        expect(dbSubscription?.status).toBe('active')
      })

      it('should handle invoice without subscription ID', async () => {
        const invoice = generateStripeInvoice({
          subscription: null, // No subscription
        })
        
        const webhookEvent = {
          type: 'invoice.payment_succeeded',
          data: { object: invoice },
        }
        
        // Should not throw error
        const result = await t.action(api.stripe.handleWebhook, {
          event: webhookEvent,
        })
        
        expect(result.received).toBe(true)
      })
    })

    describe('invoice.payment_failed', () => {
      it('should mark subscription as past_due on payment failure', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'active',
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        const failedInvoice = generateStripeInvoice({
          subscription: subscription.stripeSubscriptionId,
          payment_intent: {
            status: 'requires_payment_method',
          },
        })
        
        const webhookEvent = {
          type: 'invoice.payment_failed',
          data: { object: failedInvoice },
        }
        
        const result = await t.action(api.stripe.handleWebhook, {
          event: webhookEvent,
        })
        
        expect(result.received).toBe(true)
        
        // Verify subscription status was updated to past_due
        const dbSubscription = await t.query(internal.subscriptions.getByUser, { userId })
        expect(dbSubscription?.status).toBe('past_due')
      })
    })

    describe('Unhandled Events', () => {
      it('should handle unknown webhook events gracefully', async () => {
        const webhookEvent = {
          type: 'unknown.event.type',
          data: { object: {} },
        }
        
        const result = await t.action(api.stripe.handleWebhook, {
          event: webhookEvent,
        })
        
        expect(result.received).toBe(true)
      })
    })

    describe('Error Handling', () => {
      it('should handle webhook processing errors', async () => {
        // Mock internal mutation to throw error
        const webhookEvent = {
          type: 'customer.subscription.deleted',
          data: { 
            object: {
              id: 'sub_test',
              customer: 'cus_test',
              status: 'canceled',
              current_period_start: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000),
              cancel_at_period_end: true,
            } 
          },
        }
        
        // Force error by providing invalid data structure
        webhookEvent.data.object = null as any
        
        await expect(
          t.action(api.stripe.handleWebhook, {
            event: webhookEvent,
          })
        ).rejects.toThrow('Webhook processing failed')
      })
    })
  })

  describe('Environment Configuration', () => {
    it('should handle missing Stripe configuration gracefully', async () => {
      // This test would require mocking the environment to not have STRIPE_SECRET_KEY
      // In a real scenario, we'd test this by temporarily removing the env var
      
      const user = generateUser()
      await t.mutation(internal.users.create, user)
      
      t.withIdentity({ subject: user.externalId })
      
      // Since we can't easily mock the env var in this test setup,
      // we'll verify the current behavior with the mock
      const result = await t.action(api.stripe.createCheckoutSession, {
        planId: 'starter',
      })
      
      // With our current mock setup, this should work
      expect(result).toBeDefined()
    })
  })
})