/**
 * Polar integration for subscription and credit management
 */

import { components, internal } from "./_generated/api";
import { api } from "./_generated/api";
import { Polar } from "@convex-dev/polar";
import { v } from "convex/values";
import { internalMutation, mutation, query, QueryCtx } from "./_generated/server";
import { getCurrentUser } from "./users";

// Define credit limits for each tier
const TIER_CREDITS = {
  free: 10,
  starter: 75,
  pro: 250,
} as const;

// Initialize Polar with user info and product mappings
export const polar = new Polar(components.polar, {
  getUserInfo: async (ctx: any) => {
    const user = await getCurrentUser(ctx as QueryCtx);
    if (!user) {
      throw new Error("User not found");
    }
    return {
      userId: user._id,
      email: user.email,
    };
  },
  products: {
    // Map your Polar product IDs here
    // You'll need to get these from your Polar dashboard
    starter: process.env.POLAR_PRODUCT_STARTER_ID!,
    pro: process.env.POLAR_PRODUCT_PRO_ID!,
  },
});

/**
 * Get user's current subscription and credit information
 */
export const getUserSubscription = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    // Default values for users without subscription data
    const tier = user.subscriptionTier || "free";
    const creditsUsed = user.creditsUsed || 0;
    const creditsLimit = user.creditsLimit || TIER_CREDITS.free;
    const creditsRemaining = Math.max(0, creditsLimit - creditsUsed);

    return {
      tier,
      status: user.subscriptionStatus || "free",
      creditsUsed,
      creditsLimit,
      creditsRemaining,
      creditsResetDate: user.creditsResetDate,
      subscriptionId: user.subscriptionId,
    };
  },
});

/**
 * Check if user has enough credits for processing
 */
export const checkCredits = query({
  args: { pagesRequired: v.number() },
  handler: async (ctx, { pagesRequired }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return { hasCredits: false, creditsRemaining: 0 };
    }

    // Default values for users without subscription data
    const tier = user.subscriptionTier || "free";
    const creditsUsed = user.creditsUsed || 0;
    const creditsLimit = user.creditsLimit || TIER_CREDITS.free;
    const creditsRemaining = Math.max(0, creditsLimit - creditsUsed);

    return {
      hasCredits: creditsRemaining >= pagesRequired,
      creditsRemaining: creditsRemaining,
    };
  },
});

/**
 * Consume credits when processing a document
 */
export const consumeCredits = mutation({
  args: { pages: v.number() },
  handler: async (ctx, { pages }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const creditsUsed = user.creditsUsed || 0;
    const creditsLimit = user.creditsLimit || TIER_CREDITS.free;
    const creditsRemaining = creditsLimit - creditsUsed;

    if (creditsRemaining < pages) {
      throw new Error(
        `Insufficient credits. You have ${creditsRemaining} pages remaining this month.`
      );
    }

    await ctx.db.patch(user._id, {
      creditsUsed: creditsUsed + pages,
    });

    return {
      creditsUsed: creditsUsed + pages,
      creditsRemaining: creditsRemaining - pages,
    };
  },
});

/**
 * Initialize user with free tier credits
 */
export const initializeUserCredits = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Only initialize if not already set
    if (!user.subscriptionTier) {
      const resetDate = new Date();
      resetDate.setMonth(resetDate.getMonth() + 1);

      await ctx.db.patch(userId, {
        subscriptionTier: "free",
        subscriptionStatus: "free",
        creditsUsed: 0,
        creditsLimit: TIER_CREDITS.free,
        creditsResetDate: resetDate.getTime(),
      });
    }
  },
});

/**
 * Reset monthly credits for a user
 */
export const resetMonthlyCredits = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const tier = user.subscriptionTier || "free";
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);

    await ctx.db.patch(userId, {
      creditsUsed: 0,
      creditsLimit: TIER_CREDITS[tier],
      creditsResetDate: resetDate.getTime(),
    });
  },
});

/**
 * Create a checkout link for upgrading to a paid plan
 */
export const createCheckoutLink = mutation({
  args: { productKey: v.string() },
  handler: async (ctx, { productKey }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const checkout = await polar.createCheckoutSession(ctx, {
      productIds: [productKey === 'starter' ? process.env.POLAR_PRODUCT_STARTER_ID! : process.env.POLAR_PRODUCT_PRO_ID!],
      userId: user._id,
      email: user.email,
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      successUrl: '/dashboard/subscription',
    });

    return { url: checkout.url };
  },
});

/**
 * Create a customer portal link for managing subscription
 */
export const createCustomerPortalLink = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (!user.polarCustomerId) {
      throw new Error("No active subscription found");
    }

    // The Polar component doesn't have createCustomerPortalSession
    // Return Polar's customer portal URL directly
    const portalUrl = `https://polar.sh/${process.env.POLAR_ORGANIZATION_NAME || 'your-org'}/portal`;

    return { url: portalUrl };
  },
});

/**
 * Update user subscription from Polar webhook
 */
export const updateUserSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    subscriptionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("expired"),
      v.literal("trialing")
    ),
    productKey: v.string(),
    polarCustomerId: v.string(),
  },
  handler: async (ctx, { userId, subscriptionId, status, productKey, polarCustomerId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Map product key to tier
    const tier = productKey === "starter" ? "starter" : productKey === "pro" ? "pro" : "free";
    
    // Update subscription info
    await ctx.db.patch(userId, {
      polarCustomerId,
      subscriptionId,
      subscriptionStatus: status,
      subscriptionTier: tier,
      creditsLimit: TIER_CREDITS[tier],
    });

    // If this is a new subscription or upgrade, reset credits
    if (status === "active" && (!user.subscriptionId || user.subscriptionTier !== tier)) {
      await ctx.runMutation(internal.polar.resetMonthlyCredits, { userId });
    }
  },
});