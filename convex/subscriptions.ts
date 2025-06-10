import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const getUserSubscription = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      return null;
    }

    // Get plan details
    const plan = await ctx.db
      .query("plans")
      .filter((q) => q.eq(q.field("id"), subscription.planId))
      .first();

    return {
      ...subscription,
      plan,
    };
  },
});

export const getUserUsage = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_user_month", (q) => q.eq("userId", userId).eq("month", currentMonth))
      .first();

    return usage || { apiCalls: 0, storageUsed: 0 };
  },
});

export const getByStripeCustomer = internalQuery({
  args: {
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_customer", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();
  },
});

export const createOrUpdateSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    status: v.string(),
    planId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if subscription already exists
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingSubscription) {
      // Update existing subscription
      await ctx.db.patch(existingSubscription._id, {
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        status: args.status,
        planId: args.planId,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      });
    } else {
      // Create new subscription
      await ctx.db.insert("subscriptions", args);
    }
  },
});

export const updateSubscription = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: v.string(),
    planId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        status: args.status,
        planId: args.planId,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      });
    }
  },
});

export const updateSubscriptionStatus = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        status: args.status,
      });
    }
  },
});

export const createSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    status: v.string(),
    planId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("subscriptions", args);
  },
});

export const incrementUsage = mutation({
  args: {
    type: v.union(v.literal("apiCalls"), v.literal("storage")),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_user_month", (q) => q.eq("userId", userId).eq("month", currentMonth))
      .first();

    if (usage) {
      const updates: any = {};
      if (args.type === "apiCalls") {
        updates.apiCalls = usage.apiCalls + args.amount;
      } else {
        updates.storageUsed = usage.storageUsed + args.amount;
      }
      await ctx.db.patch(usage._id, updates);
    } else {
      const newUsage: any = {
        userId,
        month: currentMonth,
        apiCalls: args.type === "apiCalls" ? args.amount : 0,
        storageUsed: args.type === "storage" ? args.amount : 0,
      };
      await ctx.db.insert("usage", newUsage);
    }
  },
});

export const getUserPageUsage = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { used: 0, limit: 0, remaining: 0 };
    }

    // Get user's subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Determine the current billing cycle and page limit
    let billingCycleStart: number;
    let billingCycleEnd: number;
    let pageLimit = 10; // Default free plan limit

    if (subscription) {
      // User has a subscription (paid plan)
      billingCycleStart = subscription.currentPeriodStart;
      billingCycleEnd = subscription.currentPeriodEnd;
      
      // Get plan details for page limit
      const plan = await ctx.db
        .query("plans")
        .filter((q) => q.eq(q.field("id"), subscription.planId))
        .first();
      
      if (plan) {
        // Extract page limit from features (e.g., "75 pages every month")
        const pageFeature = plan.features.find(f => f.includes("pages"));
        if (pageFeature) {
          const match = pageFeature.match(/(\d+)\s+pages/);
          if (match) {
            pageLimit = parseInt(match[1]);
          }
        }
      }
    } else {
      // Free plan - use account creation date for billing cycle
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("externalId"), userId))
        .first();
      
      if (!user) {
        return { used: 0, limit: pageLimit, remaining: pageLimit };
      }
      
      // For free plan, we'll use 30-day cycles from account creation
      const now = Date.now();
      const accountAge = now - (user._creationTime || now);
      const cycleNumber = Math.floor(accountAge / (30 * 24 * 60 * 60 * 1000));
      billingCycleStart = (user._creationTime || now) + (cycleNumber * 30 * 24 * 60 * 60 * 1000);
      billingCycleEnd = billingCycleStart + (30 * 24 * 60 * 60 * 1000);
    }

    // Get usage for current billing cycle
    const usage = await ctx.db
      .query("pageUsage")
      .withIndex("by_user_and_cycle", (q) => 
        q.eq("userId", userId)
         .eq("billingCycleStart", billingCycleStart)
         .eq("billingCycleEnd", billingCycleEnd)
      )
      .collect();

    const used = usage.reduce((total, record) => total + record.pageCount, 0);
    const remaining = Math.max(0, pageLimit - used);

    return {
      used,
      limit: pageLimit,
      remaining,
      billingCycleStart,
      billingCycleEnd,
    };
  },
});

export const recordPageUsage = internalMutation({
  args: {
    userId: v.id("users"),
    documentId: v.id("documents"),
    pageCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Get user's current billing cycle
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    let billingCycleStart: number;
    let billingCycleEnd: number;

    if (subscription) {
      billingCycleStart = subscription.currentPeriodStart;
      billingCycleEnd = subscription.currentPeriodEnd;
    } else {
      // Free plan - calculate billing cycle from user creation
      const user = await ctx.db.get(args.userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const now = Date.now();
      const accountAge = now - (user._creationTime || now);
      const cycleNumber = Math.floor(accountAge / (30 * 24 * 60 * 60 * 1000));
      billingCycleStart = (user._creationTime || now) + (cycleNumber * 30 * 24 * 60 * 60 * 1000);
      billingCycleEnd = billingCycleStart + (30 * 24 * 60 * 60 * 1000);
    }

    // Record the usage
    await ctx.db.insert("pageUsage", {
      userId: args.userId,
      documentId: args.documentId,
      pageCount: args.pageCount,
      processedAt: Date.now(),
      billingCycleStart,
      billingCycleEnd,
    });
  },
});

export const checkPageLimit = query({
  args: {
    requiredPages: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { allowed: false, reason: "Not authenticated" };
    }

    const usage = await ctx.runQuery(api.subscriptions.getUserPageUsage);
    
    if (!usage) {
      return { allowed: false, reason: "Unable to check usage" };
    }

    if (usage.remaining < args.requiredPages) {
      return { 
        allowed: false, 
        reason: `Insufficient pages. You have ${usage.remaining} pages remaining, but ${args.requiredPages} are required.`,
        usage
      };
    }

    return { allowed: true, usage };
  },
});
