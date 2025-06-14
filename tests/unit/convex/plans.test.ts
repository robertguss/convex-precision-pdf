/**
 * ABOUTME: Unit tests for plan configuration and seeding functionality
 * ABOUTME: Tests plan CRUD operations, seeding logic, and plan data integrity
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { convexTest } from 'convex-test'

// Mock the api to avoid module loading issues
const mockApi = {
  plans: {
    seedPlans: { _name: 'plans.seedPlans' },
    list: { _name: 'plans.list' },
  }
}

describe('Plans Management', () => {
  let t: any

  beforeEach(async () => {
    try {
      const schema = await import('../../../convex/schema')
      t = convexTest(schema.default)
    } catch (error) {
      // Fallback to mock implementation for testing
      t = {
        query: vi.fn(),
        mutation: vi.fn(),
        action: vi.fn(),
        withIdentity: vi.fn().mockReturnThis(),
      }
    }
  })

  describe('seedPlans', () => {
    it('should seed all three plans correctly', async () => {
      const result = await t.mutation(api.plans.seedPlans)
      expect(result).toBe('Plans seeded successfully')
      
      const plans = await t.query(api.plans.list)
      expect(plans).toHaveLength(3)
      
      // Verify Free plan
      const freePlan = plans.find((p: any) => p.id === 'free')
      expect(freePlan).toBeDefined()
      expect(freePlan?.name).toBe('Free')
      expect(freePlan?.description).toBe('Perfect for getting started')
      expect(freePlan?.price).toBe(0)
      expect(freePlan?.interval).toBe('month')
      expect(freePlan?.stripePriceId).toBe('price_1RVxfg4Qp58g8uFw6KhUsp9J')
      expect(freePlan?.features).toEqual(['10 pages per month'])
      expect(freePlan?.popular).toBeUndefined()
      
      // Verify Starter plan
      const starterPlan = plans.find((p: any) => p.id === 'starter')
      expect(starterPlan).toBeDefined()
      expect(starterPlan?.name).toBe('Starter')
      expect(starterPlan?.description).toBe('For growing businesses')
      expect(starterPlan?.price).toBe(999) // $9.99 in cents
      expect(starterPlan?.interval).toBe('month')
      expect(starterPlan?.stripePriceId).toBe('price_1RVxgR4Qp58g8uFwKTF0M73d')
      expect(starterPlan?.features).toEqual(['75 pages every month'])
      expect(starterPlan?.popular).toBe(true)
      
      // Verify Pro plan
      const proPlan = plans.find((p: any) => p.id === 'pro')
      expect(proPlan).toBeDefined()
      expect(proPlan?.name).toBe('Pro')
      expect(proPlan?.description).toBe('For large organizations')
      expect(proPlan?.price).toBe(2499) // $24.99 in cents
      expect(proPlan?.interval).toBe('month')
      expect(proPlan?.stripePriceId).toBe('price_1RVxgx4Qp58g8uFwO8Eyjre3')
      expect(proPlan?.features).toEqual(['250 pages every month'])
      expect(proPlan?.popular).toBeUndefined()
    })

    it('should not reseed when plans already exist', async () => {
      // First seeding
      const firstResult = await t.mutation(api.plans.seedPlans)
      expect(firstResult).toBe('Plans seeded successfully')
      
      // Second attempt should not reseed
      const secondResult = await t.mutation(api.plans.seedPlans)
      expect(secondResult).toBe('Plans already seeded')
      
      // Should still have exactly 3 plans
      const plans = await t.query(api.plans.list)
      expect(plans).toHaveLength(3)
    })

    it('should maintain plan order and structure', async () => {
      await t.mutation(api.plans.seedPlans)
      const plans = await t.query(api.plans.list)
      
      // Plans should be ordered as: free, starter, pro
      const planIds = plans.map((p: any) => p.id)
      expect(planIds).toContain('free')
      expect(planIds).toContain('starter')
      expect(planIds).toContain('pro')
      
      // Verify all required fields are present
      plans.forEach((plan: any) => {
        expect(plan.id).toBeDefined()
        expect(plan.name).toBeDefined()
        expect(plan.description).toBeDefined()
        expect(plan.price).toBeDefined()
        expect(plan.interval).toBe('month')
        expect(plan.stripePriceId).toBeDefined()
        expect(plan.features).toBeDefined()
        expect(Array.isArray(plan.features)).toBe(true)
        expect(plan.features.length).toBeGreaterThan(0)
      })
    })

    it('should handle concurrent seeding attempts', async () => {
      // Simulate multiple concurrent seeding attempts
      const seedPromises = Array(5).fill(null).map(() => 
        t.mutation(api.plans.seedPlans)
      )
      
      const results = await Promise.all(seedPromises)
      
      // One should succeed, others should return "already seeded"
      const successCount = results.filter(r => r === 'Plans seeded successfully').length
      const alreadySeededCount = results.filter(r => r === 'Plans already seeded').length
      
      expect(successCount).toBe(1)
      expect(alreadySeededCount).toBe(4)
      
      // Should still have exactly 3 plans
      const plans = await t.query(api.plans.list)
      expect(plans).toHaveLength(3)
    })
  })

  describe('list', () => {
    it('should return empty array when no plans exist', async () => {
      const plans = await t.query(api.plans.list)
      expect(plans).toEqual([])
    })

    it('should return all plans after seeding', async () => {
      await t.mutation(api.plans.seedPlans)
      const plans = await t.query(api.plans.list)
      
      expect(plans).toHaveLength(3)
      expect(plans.every((plan: any) => typeof plan === 'object')).toBe(true)
    })

    it('should return plans with consistent structure', async () => {
      await t.mutation(api.plans.seedPlans)
      const plans = await t.query(api.plans.list)
      
      const requiredFields = ['id', 'name', 'description', 'price', 'interval', 'stripePriceId', 'features']
      
      plans.forEach((plan: any) => {
        requiredFields.forEach(field => {
          expect(plan).toHaveProperty(field)
        })
      })
    })

    it('should maintain referential integrity with Stripe price IDs', async () => {
      await t.mutation(api.plans.seedPlans)
      const plans = await t.query(api.plans.list)
      
      const stripePriceIds = plans.map((p: any) => p.stripePriceId)
      
      // Should have unique Stripe price IDs
      const uniquePriceIds = new Set(stripePriceIds)
      expect(uniquePriceIds.size).toBe(plans.length)
      
      // Should follow Stripe price ID format
      stripePriceIds.forEach(priceId => {
        expect(priceId).toMatch(/^price_[a-zA-Z0-9]+$/)
      })
    })
  })

  describe('Plan Data Integrity', () => {
    beforeEach(async () => {
      await t.mutation(api.plans.seedPlans)
    })

    it('should have correct pricing structure', async () => {
      const plans = await t.query(api.plans.list)
      
      const freePlan = plans.find((p: any) => p.id === 'free')
      const starterPlan = plans.find((p: any) => p.id === 'starter')
      const proPlan = plans.find((p: any) => p.id === 'pro')
      
      // Pricing should be in ascending order
      expect(freePlan?.price).toBe(0)
      expect(starterPlan?.price).toBeGreaterThan(freePlan?.price)
      expect(proPlan?.price).toBeGreaterThan(starterPlan?.price)
      
      // Prices should be in cents
      expect(starterPlan?.price).toBe(999) // $9.99
      expect(proPlan?.price).toBe(2499) // $24.99
    })

    it('should have correct page limits in features', async () => {
      const plans = await t.query(api.plans.list)
      
      const freePlan = plans.find((p: any) => p.id === 'free')
      const starterPlan = plans.find((p: any) => p.id === 'starter')
      const proPlan = plans.find((p: any) => p.id === 'pro')
      
      // Extract page limits from features
      const extractPageLimit = (features: string[]) => {
        const pageFeature = features.find(f => f.includes('pages'))
        const match = pageFeature?.match(/(\d+)\s+pages/)
        return match ? parseInt(match[1]) : 0
      }
      
      const freeLimit = extractPageLimit(freePlan?.features || [])
      const starterLimit = extractPageLimit(starterPlan?.features || [])
      const proLimit = extractPageLimit(proPlan?.features || [])
      
      // Page limits should be in ascending order
      expect(freeLimit).toBe(10)
      expect(starterLimit).toBe(75)
      expect(proLimit).toBe(250)
      
      expect(starterLimit).toBeGreaterThan(freeLimit)
      expect(proLimit).toBeGreaterThan(starterLimit)
    })

    it('should have proper popular plan marking', async () => {
      const plans = await t.query(api.plans.list)
      
      const popularPlans = plans.filter((p: any) => p.popular === true)
      
      // Only starter plan should be marked as popular
      expect(popularPlans).toHaveLength(1)
      expect(popularPlans[0].id).toBe('starter')
      
      // Other plans should not have popular property or be false
      const freePlan = plans.find((p: any) => p.id === 'free')
      const proPlan = plans.find((p: any) => p.id === 'pro')
      
      expect(freePlan?.popular).toBeUndefined()
      expect(proPlan?.popular).toBeUndefined()
    })

    it('should have consistent interval settings', async () => {
      const plans = await t.query(api.plans.list)
      
      // All plans should be monthly
      plans.forEach((plan: any) => {
        expect(plan.interval).toBe('month')
      })
    })

    it('should have meaningful descriptions', async () => {
      const plans = await t.query(api.plans.list)
      
      plans.forEach((plan: any) => {
        expect(plan.description).toBeDefined()
        expect(typeof plan.description).toBe('string')
        expect(plan.description.length).toBeGreaterThan(0)
        expect(plan.description.trim()).toBe(plan.description) // No leading/trailing whitespace
      })
      
      // Descriptions should be unique
      const descriptions = plans.map((p: any) => p.description)
      const uniqueDescriptions = new Set(descriptions)
      expect(uniqueDescriptions.size).toBe(plans.length)
    })

    it('should have valid feature arrays', async () => {
      const plans = await t.query(api.plans.list)
      
      plans.forEach((plan: any) => {
        expect(Array.isArray(plan.features)).toBe(true)
        expect(plan.features.length).toBeGreaterThan(0)
        
        plan.features.forEach((feature: string) => {
          expect(typeof feature).toBe('string')
          expect(feature.length).toBeGreaterThan(0)
          expect(feature.trim()).toBe(feature) // No leading/trailing whitespace
        })
      })
    })
  })

  describe('Plan Lookup and Validation', () => {
    beforeEach(async () => {
      await t.mutation(api.plans.seedPlans)
    })

    it('should allow finding plans by ID', async () => {
      const plans = await t.query(api.plans.list)
      
      const planIds = ['free', 'starter', 'pro']
      
      planIds.forEach(planId => {
        const plan = plans.find((p: any) => p.id === planId)
        expect(plan).toBeDefined()
        expect(plan?.id).toBe(planId)
      })
    })

    it('should allow finding plans by Stripe price ID', async () => {
      const plans = await t.query(api.plans.list)
      
      const stripePriceIdMappings = {
        'price_1RVxfg4Qp58g8uFw6KhUsp9J': 'free',
        'price_1RVxgR4Qp58g8uFwKTF0M73d': 'starter',
        'price_1RVxgx4Qp58g8uFwO8Eyjre3': 'pro',
      }
      
      Object.entries(stripePriceIdMappings).forEach(([priceId, expectedPlanId]) => {
        const plan = plans.find((p: any) => p.stripePriceId === priceId)
        expect(plan).toBeDefined()
        expect(plan?.id).toBe(expectedPlanId)
      })
    })

    it('should have unique plan IDs', async () => {
      const plans = await t.query(api.plans.list)
      
      const planIds = plans.map((p: any) => p.id)
      const uniqueIds = new Set(planIds)
      
      expect(uniqueIds.size).toBe(plans.length)
    })

    it('should have unique Stripe price IDs', async () => {
      const plans = await t.query(api.plans.list)
      
      const stripePriceIds = plans.map((p: any) => p.stripePriceId)
      const uniquePriceIds = new Set(stripePriceIds)
      
      expect(uniquePriceIds.size).toBe(plans.length)
    })
  })

  describe('Edge Cases', () => {
    it('should handle database constraints properly', async () => {
      await t.mutation(api.plans.seedPlans)
      
      // Attempting to seed again should not cause conflicts
      const result = await t.mutation(api.plans.seedPlans)
      expect(result).toBe('Plans already seeded')
      
      const plans = await t.query(api.plans.list)
      expect(plans).toHaveLength(3)
    })

    it('should maintain consistency across multiple queries', async () => {
      await t.mutation(api.plans.seedPlans)
      
      // Query multiple times and verify consistency
      const queries = Array(10).fill(null).map(() => t.query(api.plans.list))
      const results = await Promise.all(queries)
      
      // All results should be identical
      const firstResult = JSON.stringify(results[0])
      results.forEach(result => {
        expect(JSON.stringify(result)).toBe(firstResult)
      })
    })

    it('should handle empty database state correctly', async () => {
      // Before seeding, list should be empty
      const emptyPlans = await t.query(api.plans.list)
      expect(emptyPlans).toEqual([])
      
      // After seeding, should have plans
      await t.mutation(api.plans.seedPlans)
      const seededPlans = await t.query(api.plans.list)
      expect(seededPlans).toHaveLength(3)
    })
  })
})