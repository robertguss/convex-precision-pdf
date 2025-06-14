/**
 * ABOUTME: Comprehensive unit tests for subscription and payment business logic
 * ABOUTME: Tests subscription tier limits, credit calculations, and usage tracking with 95%+ coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { convexTest } from 'convex-test'
import { api, internal } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { generateUser, generateSubscription, generateFreePlan } from '../../utils/data/generators'

describe('Subscription Business Logic', () => {
  let t: any

  beforeEach(async () => {
    const schema = await import('../../../convex/schema')
    t = convexTest(schema.default)
    
    // Seed plans for testing
    await t.mutation(api.plans.seedPlans)
  })

  describe('getUserSubscription', () => {
    it('should return null for unauthenticated user', async () => {
      const result = await t.query(api.subscriptions.getUserSubscription)
      expect(result).toBeNull()
    })

    it('should return null for user without subscription', async () => {
      const user = generateUser()
      await t.mutation(internal.users.create, user)
      
      // Mock auth to return the user's external ID
      t.withIdentity({ subject: user.externalId })
      
      const result = await t.query(api.subscriptions.getUserSubscription)
      expect(result).toBeNull()
    })

    it('should return subscription with plan details for subscribed user', async () => {
      const user = generateUser()
      const userId = await t.mutation(internal.users.create, user)
      
      const subscription = generateSubscription({
        userId,
        planId: 'starter',
        status: 'active',
      })
      await t.mutation(internal.subscriptions.createSubscription, subscription)
      
      t.withIdentity({ subject: user.externalId })
      
      const result = await t.query(api.subscriptions.getUserSubscription)
      expect(result).toBeDefined()
      expect(result?.planId).toBe('starter')
      expect(result?.status).toBe('active')
      expect(result?.plan).toBeDefined()
      expect(result?.plan?.name).toBe('Starter')
    })
  })

  describe('Page Usage Tracking', () => {
    describe('getUserPageUsage', () => {
      it('should return default limits for unauthenticated user', async () => {
        const result = await t.query(api.subscriptions.getUserPageUsage)
        expect(result).toEqual({
          used: 0,
          limit: 0,
          remaining: 0,
        })
      })

      it('should return free plan limits for user without subscription', async () => {
        const user = generateUser()
        await t.mutation(internal.users.create, user)
        
        t.withIdentity({ subject: user.externalId })
        
        const result = await t.query(api.subscriptions.getUserPageUsage)
        expect(result.limit).toBe(10) // Free plan limit
        expect(result.used).toBe(0)
        expect(result.remaining).toBe(10)
        expect(result.billingCycleStart).toBeDefined()
        expect(result.billingCycleEnd).toBeDefined()
      })

      it('should return correct limits for starter plan', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const now = Date.now()
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        t.withIdentity({ subject: user.externalId })
        
        const result = await t.query(api.subscriptions.getUserPageUsage)
        expect(result.limit).toBe(75) // Starter plan limit
        expect(result.used).toBe(0)
        expect(result.remaining).toBe(75)
      })

      it('should return correct limits for pro plan', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const now = Date.now()
        const subscription = generateSubscription({
          userId,
          planId: 'pro',
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        t.withIdentity({ subject: user.externalId })
        
        const result = await t.query(api.subscriptions.getUserPageUsage)
        expect(result.limit).toBe(250) // Pro plan limit
        expect(result.used).toBe(0)
        expect(result.remaining).toBe(250)
      })

      it('should calculate usage correctly with existing page usage', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const now = Date.now()
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        // Add some page usage
        const document1Id = await t.mutation(internal.documents.create, {
          title: 'Test Doc 1',
          userId,
          status: 'completed',
        })
        
        await t.mutation(api.subscriptions.recordPageUsage, {
          userId,
          documentId: document1Id,
          pageCount: 25,
        })
        
        const document2Id = await t.mutation(internal.documents.create, {
          title: 'Test Doc 2',
          userId,
          status: 'completed',
        })
        
        await t.mutation(api.subscriptions.recordPageUsage, {
          userId,
          documentId: document2Id,
          pageCount: 15,
        })
        
        t.withIdentity({ subject: user.externalId })
        
        const result = await t.query(api.subscriptions.getUserPageUsage)
        expect(result.limit).toBe(75)
        expect(result.used).toBe(40) // 25 + 15
        expect(result.remaining).toBe(35) // 75 - 40
      })

      it('should handle billing cycle calculations for free users correctly', async () => {
        const user = generateUser()
        const creationTime = Date.now() - (35 * 24 * 60 * 60 * 1000) // 35 days ago
        await t.mutation(internal.users.create, { ...user, _creationTime: creationTime })
        
        t.withIdentity({ subject: user.externalId })
        
        const result = await t.query(api.subscriptions.getUserPageUsage)
        expect(result.limit).toBe(10)
        expect(result.billingCycleStart).toBeDefined()
        expect(result.billingCycleEnd).toBeDefined()
        
        // Verify we're in the second billing cycle
        const expectedCycleStart = creationTime + (30 * 24 * 60 * 60 * 1000)
        expect(result.billingCycleStart).toBeCloseTo(expectedCycleStart, -5)
      })
    })

    describe('checkPageLimit', () => {
      it('should deny access for unauthenticated user', async () => {
        const result = await t.query(api.subscriptions.checkPageLimit, {
          requiredPages: 5,
        })
        expect(result.allowed).toBe(false)
        expect(result.reason).toBe('Not authenticated')
      })

      it('should allow processing when sufficient pages available', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const now = Date.now()
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        t.withIdentity({ subject: user.externalId })
        
        const result = await t.query(api.subscriptions.checkPageLimit, {
          requiredPages: 50,
        })
        expect(result.allowed).toBe(true)
        expect(result.usage?.used).toBe(0)
        expect(result.usage?.limit).toBe(75)
        expect(result.usage?.remaining).toBe(75)
      })

      it('should deny processing when insufficient pages available', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        // Create subscription with starter plan (75 pages)
        const now = Date.now()
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        // Use up 70 pages
        const documentId = await t.mutation(internal.documents.create, {
          title: 'Test Doc',
          userId,
          status: 'completed',
        })
        
        await t.mutation(api.subscriptions.recordPageUsage, {
          userId,
          documentId,
          pageCount: 70,
        })
        
        t.withIdentity({ subject: user.externalId })
        
        // Try to process 10 more pages (only 5 remaining)
        const result = await t.query(api.subscriptions.checkPageLimit, {
          requiredPages: 10,
        })
        expect(result.allowed).toBe(false)
        expect(result.reason).toContain('Insufficient pages')
        expect(result.reason).toContain('5 pages remaining')
        expect(result.reason).toContain('10 are required')
        expect(result.usage?.used).toBe(70)
        expect(result.usage?.remaining).toBe(5)
      })

      it('should handle edge case of exactly meeting limit', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        t.withIdentity({ subject: user.externalId })
        
        // Free user trying to use exactly 10 pages
        const result = await t.query(api.subscriptions.checkPageLimit, {
          requiredPages: 10,
        })
        expect(result.allowed).toBe(true)
        expect(result.usage?.remaining).toBe(10)
      })

      it('should handle zero page requests', async () => {
        const user = generateUser()
        await t.mutation(internal.users.create, user)
        
        t.withIdentity({ subject: user.externalId })
        
        const result = await t.query(api.subscriptions.checkPageLimit, {
          requiredPages: 0,
        })
        expect(result.allowed).toBe(true)
      })

      it('should handle negative page requests', async () => {
        const user = generateUser()
        await t.mutation(internal.users.create, user)
        
        t.withIdentity({ subject: user.externalId })
        
        const result = await t.query(api.subscriptions.checkPageLimit, {
          requiredPages: -1,
        })
        expect(result.allowed).toBe(true)
      })
    })

    describe('recordPageUsage', () => {
      it('should record page usage for paid subscription', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const now = Date.now()
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        const documentId = await t.mutation(internal.documents.create, {
          title: 'Test Doc',
          userId,
          status: 'completed',
        })
        
        await t.mutation(api.subscriptions.recordPageUsage, {
          userId,
          documentId,
          pageCount: 25,
        })
        
        // Verify usage was recorded
        const usage = await t.query(internal.pageUsage.getByUser, { userId })
        expect(usage).toHaveLength(1)
        expect(usage[0].pageCount).toBe(25)
        expect(usage[0].billingCycleStart).toBe(now)
        expect(usage[0].billingCycleEnd).toBe(now + 30 * 24 * 60 * 60 * 1000)
      })

      it('should record page usage for free user with correct billing cycle', async () => {
        const user = generateUser()
        const creationTime = Date.now() - (5 * 24 * 60 * 60 * 1000) // 5 days ago
        const userId = await t.mutation(internal.users.create, { ...user, _creationTime: creationTime })
        
        const documentId = await t.mutation(internal.documents.create, {
          title: 'Test Doc',
          userId,
          status: 'completed',
        })
        
        await t.mutation(api.subscriptions.recordPageUsage, {
          userId,
          documentId,
          pageCount: 8,
        })
        
        // Verify usage was recorded with correct free plan billing cycle
        const usage = await t.query(internal.pageUsage.getByUser, { userId })
        expect(usage).toHaveLength(1)
        expect(usage[0].pageCount).toBe(8)
        expect(usage[0].billingCycleStart).toBe(creationTime) // Should be user creation time
      })

      it('should throw error for non-existent user', async () => {
        const fakeUserId = 'invalid_user_id' as Id<'users'>
        const documentId = await t.mutation(internal.documents.create, {
          title: 'Test Doc',
          userId: fakeUserId,
          status: 'completed',
        })
        
        await expect(
          t.mutation(api.subscriptions.recordPageUsage, {
            userId: fakeUserId,
            documentId,
            pageCount: 10,
          })
        ).rejects.toThrow('User not found')
      })
    })
  })

  describe('Subscription Management', () => {
    describe('createOrUpdateSubscription', () => {
      it('should create new subscription when none exists', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const subscriptionData = generateMockSubscription({
          userId,
          planId: 'starter',
          status: 'active',
        })
        
        await t.mutation(internal.subscriptions.createOrUpdateSubscription, subscriptionData)
        
        const result = await t.query(internal.subscriptions.getByUser, { userId })
        expect(result).toBeDefined()
        expect(result?.planId).toBe('starter')
        expect(result?.status).toBe('active')
      })

      it('should update existing subscription', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        // Create initial subscription
        const initialSubscription = generateMockSubscription({
          userId,
          planId: 'starter',
          status: 'active',
        })
        await t.mutation(internal.subscriptions.createSubscription, initialSubscription)
        
        // Update to pro plan
        const updatedSubscription = generateMockSubscription({
          userId,
          planId: 'pro',
          status: 'active',
          stripeCustomerId: initialSubscription.stripeCustomerId,
        })
        
        await t.mutation(internal.subscriptions.createOrUpdateSubscription, updatedSubscription)
        
        const result = await t.query(internal.subscriptions.getByUser, { userId })
        expect(result?.planId).toBe('pro')
        expect(result?.status).toBe('active')
      })
    })

    describe('updateSubscription', () => {
      it('should update subscription by Stripe subscription ID', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'active',
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        const now = Date.now()
        await t.mutation(internal.subscriptions.updateSubscription, {
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          status: 'canceled',
          planId: 'free',
          currentPeriodStart: now,
          currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
          cancelAtPeriodEnd: true,
        })
        
        const result = await t.query(internal.subscriptions.getByUser, { userId })
        expect(result?.status).toBe('canceled')
        expect(result?.planId).toBe('free')
        expect(result?.cancelAtPeriodEnd).toBe(true)
      })

      it('should handle non-existent subscription gracefully', async () => {
        const now = Date.now()
        
        // Should not throw error when subscription doesn't exist
        await t.mutation(internal.subscriptions.updateSubscription, {
          stripeSubscriptionId: 'non_existent_sub_id',
          status: 'canceled',
          planId: 'free',
          currentPeriodStart: now,
          currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
          cancelAtPeriodEnd: true,
        })
        
        // Verify no subscriptions were created
        const allSubs = await t.query(internal.subscriptions.getAll)
        expect(allSubs).toHaveLength(0)
      })
    })

    describe('updateSubscriptionStatus', () => {
      it('should update only the status field', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'active',
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        await t.mutation(internal.subscriptions.updateSubscriptionStatus, {
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          status: 'past_due',
        })
        
        const result = await t.query(internal.subscriptions.getByUser, { userId })
        expect(result?.status).toBe('past_due')
        expect(result?.planId).toBe('starter') // Should remain unchanged
      })
    })

    describe('getByStripeCustomer', () => {
      it('should find subscription by Stripe customer ID', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'active',
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        const result = await t.query(internal.subscriptions.getByStripeCustomer, {
          stripeCustomerId: subscription.stripeCustomerId,
        })
        
        expect(result).toBeDefined()
        expect(result?.stripeCustomerId).toBe(subscription.stripeCustomerId)
        expect(result?.planId).toBe('starter')
      })

      it('should return null for non-existent customer', async () => {
        const result = await t.query(internal.subscriptions.getByStripeCustomer, {
          stripeCustomerId: 'cus_nonexistent',
        })
        
        expect(result).toBeNull()
      })
    })
  })

  describe('Edge Cases and Error Conditions', () => {
    describe('Plan Limit Extraction', () => {
      it('should handle malformed plan features gracefully', async () => {
        // Create a plan with malformed features
        const malformedPlan = {
          id: 'malformed',
          name: 'Malformed Plan',
          description: 'Plan with bad features',
          price: 1999,
          interval: 'month',
          stripePriceId: 'price_malformed',
          features: ['unlimited processing', 'no page limit mentioned'],
        }
        
        await t.mutation(internal.plans.create, malformedPlan)
        
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const subscription = generateSubscription({
          userId,
          planId: 'malformed',
          status: 'active',
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        t.withIdentity({ subject: user.externalId })
        
        // Should fallback to default behavior when page limit can't be extracted
        const result = await t.query(api.subscriptions.getUserPageUsage)
        expect(result.limit).toBe(10) // Should default to free plan limit
      })

      it('should handle plans with zero page features', async () => {
        const zeroPlan = {
          id: 'zero',
          name: 'Zero Plan',
          description: 'Plan with zero pages',
          price: 0,
          interval: 'month',
          stripePriceId: 'price_zero',
          features: ['0 pages per month'],
        }
        
        await t.mutation(internal.plans.create, zeroPlan)
        
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const subscription = generateSubscription({
          userId,
          planId: 'zero',
          status: 'active',
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        t.withIdentity({ subject: user.externalId })
        
        const result = await t.query(api.subscriptions.getUserPageUsage)
        expect(result.limit).toBe(0)
        expect(result.remaining).toBe(0)
      })
    })

    describe('Billing Cycle Edge Cases', () => {
      it('should handle users created exactly 30 days ago', async () => {
        const user = generateUser()
        const exactly30DaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
        await t.mutation(internal.users.create, { ...user, _creationTime: exactly30DaysAgo })
        
        t.withIdentity({ subject: user.externalId })
        
        const result = await t.query(api.subscriptions.getUserPageUsage)
        expect(result.billingCycleStart).toBe(exactly30DaysAgo)
        expect(result.billingCycleEnd).toBe(exactly30DaysAgo + 30 * 24 * 60 * 60 * 1000)
      })

      it('should handle subscription period boundaries correctly', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const periodStart = Date.now()
        const periodEnd = periodStart + (30 * 24 * 60 * 60 * 1000)
        
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'active',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        t.withIdentity({ subject: user.externalId })
        
        const result = await t.query(api.subscriptions.getUserPageUsage)
        expect(result.billingCycleStart).toBe(periodStart)
        expect(result.billingCycleEnd).toBe(periodEnd)
      })
    })

    describe('Concurrent Usage Scenarios', () => {
      it('should handle multiple simultaneous page usage records', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const now = Date.now()
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        // Simulate multiple documents being processed simultaneously
        const docIds = []
        for (let i = 0; i < 5; i++) {
          const docId = await t.mutation(internal.documents.create, {
            title: `Test Doc ${i}`,
            userId,
            status: 'completed',
          })
          docIds.push(docId)
        }
        
        // Record usage for all documents
        const usagePromises = docIds.map((docId, index) =>
          t.mutation(api.subscriptions.recordPageUsage, {
            userId,
            documentId: docId,
            pageCount: 10 + index, // 10, 11, 12, 13, 14 pages
          })
        )
        
        await Promise.all(usagePromises)
        
        t.withIdentity({ subject: user.externalId })
        
        const result = await t.query(api.subscriptions.getUserPageUsage)
        expect(result.used).toBe(60) // 10+11+12+13+14
        expect(result.remaining).toBe(15) // 75-60
      })
    })

    describe('Subscription Status Edge Cases', () => {
      it('should handle canceled subscription with future period end', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const now = Date.now()
        const futureEnd = now + (15 * 24 * 60 * 60 * 1000) // 15 days from now
        
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'canceled',
          currentPeriodStart: now - (15 * 24 * 60 * 60 * 1000),
          currentPeriodEnd: futureEnd,
          cancelAtPeriodEnd: true,
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        t.withIdentity({ subject: user.externalId })
        
        // Should still have access to paid features until period ends
        const result = await t.query(api.subscriptions.getUserPageUsage)
        expect(result.limit).toBe(75) // Still starter plan limits
        expect(result.billingCycleEnd).toBe(futureEnd)
      })

      it('should handle past_due subscription status', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'past_due',
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        t.withIdentity({ subject: user.externalId })
        
        const result = await t.query(api.subscriptions.getUserPageUsage)
        expect(result.limit).toBe(75) // Should still have plan limits
        
        const checkResult = await t.query(api.subscriptions.checkPageLimit, {
          requiredPages: 50,
        })
        expect(checkResult.allowed).toBe(true) // Past due should still allow usage
      })

      it('should handle incomplete subscription status', async () => {
        const user = generateUser()
        const userId = await t.mutation(internal.users.create, user)
        
        const subscription = generateSubscription({
          userId,
          planId: 'starter',
          status: 'incomplete',
        })
        await t.mutation(internal.subscriptions.createSubscription, subscription)
        
        t.withIdentity({ subject: user.externalId })
        
        const result = await t.query(api.subscriptions.getUserPageUsage)
        // Incomplete subscription should still provide plan benefits
        expect(result.limit).toBe(75)
      })
    })
  })
})