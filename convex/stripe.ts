"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    })
  : null;

export const createCheckoutSession = action({
  args: {
    planId: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string; sessionId: string }> => {
    if (!stripe) {
      throw new Error("Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.");
    }

    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.auth.loggedInUser);
    if (!user) {
      throw new Error("User not found");
    }

    const plans = await ctx.runQuery(api.plans.list);
    const selectedPlan = plans.find((p: any) => p.id === args.planId);
    if (!selectedPlan) {
      throw new Error("Plan not found");
    }

    try {
      // Check if user already has a Stripe customer ID
      let customerId: string;
      const existingSubscription = await ctx.runQuery(api.subscriptions.getUserSubscription);
      
      if (existingSubscription?.stripeCustomerId) {
        customerId = existingSubscription.stripeCustomerId;
      } else {
        // Create a new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            convexUserId: userId,
          },
        });
        customerId = customer.id;
      }

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: selectedPlan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.SITE_URL || "http://localhost:5173"}?success=true`,
        cancel_url: `${process.env.SITE_URL || "http://localhost:5173"}?canceled=true`,
        metadata: {
          convexUserId: userId,
          planId: args.planId,
        },
      });

      if (!session.url) {
        throw new Error("Failed to create checkout session");
      }

      return {
        url: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      console.error("Stripe checkout error:", error);
      throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

export const createPortalSession = action({
  args: {},
  handler: async (ctx): Promise<{ url: string }> => {
    if (!stripe) {
      throw new Error("Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.");
    }

    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const subscription = await ctx.runQuery(api.subscriptions.getUserSubscription);
    if (!subscription?.stripeCustomerId) {
      throw new Error("No subscription found");
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: process.env.SITE_URL || "http://localhost:5173",
      });

      return {
        url: session.url,
      };
    } catch (error) {
      console.error("Stripe portal error:", error);
      throw new Error(`Failed to create portal session: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

export const handleWebhook = action({
  args: {
    event: v.any(),
  },
  handler: async (ctx, args): Promise<{ received: boolean }> => {
    const event = args.event;
    
    console.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object;
          if (session.mode === "subscription") {
            // Get the subscription details
            if (!stripe) {
              console.error("Stripe not configured");
              break;
            }
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            const customer = await stripe.customers.retrieve(session.customer);
            
            const convexUserId = session.metadata?.convexUserId;
            if (!convexUserId) {
              console.error("No convex user ID in session metadata");
              break;
            }

            // Create or update subscription in our database
            await ctx.runMutation(internal.subscriptions.createOrUpdateSubscription, {
              userId: convexUserId as any,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              planId: session.metadata?.planId || "basic",
              currentPeriodStart: (subscription as any).current_period_start * 1000,
              currentPeriodEnd: (subscription as any).current_period_end * 1000,
              cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
            });
          }
          break;

        case "customer.subscription.created":
        case "customer.subscription.updated":
          const subscriptionData = event.data.object;
          
          // Find the user by Stripe customer ID
          const userSub = await ctx.runQuery(internal.subscriptions.getByStripeCustomer, {
            stripeCustomerId: subscriptionData.customer,
          });

          if (userSub) {
            await ctx.runMutation(internal.subscriptions.updateSubscription, {
              stripeSubscriptionId: subscriptionData.id,
              status: subscriptionData.status,
              planId: subscriptionData.items.data[0].price.lookup_key || "basic",
              currentPeriodStart: subscriptionData.current_period_start * 1000,
              currentPeriodEnd: subscriptionData.current_period_end * 1000,
              cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
            });
          }
          break;
        
        case "customer.subscription.deleted":
          const deletedSubscription = event.data.object;
          await ctx.runMutation(internal.subscriptions.updateSubscription, {
            stripeSubscriptionId: deletedSubscription.id,
            status: "canceled",
            planId: "basic",
            currentPeriodStart: deletedSubscription.current_period_start * 1000,
            currentPeriodEnd: deletedSubscription.current_period_end * 1000,
            cancelAtPeriodEnd: true,
          });
          break;

        case "invoice.payment_succeeded":
          const invoice = event.data.object;
          if (invoice.subscription) {
            // Update subscription status to active
            await ctx.runMutation(internal.subscriptions.updateSubscriptionStatus, {
              stripeSubscriptionId: invoice.subscription,
              status: "active",
            });
          }
          break;

        case "invoice.payment_failed":
          const failedInvoice = event.data.object;
          if (failedInvoice.subscription) {
            // Update subscription status to past_due
            await ctx.runMutation(internal.subscriptions.updateSubscriptionStatus, {
              stripeSubscriptionId: failedInvoice.subscription,
              status: "past_due",
            });
          }
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error("Webhook processing error:", error);
      throw new Error(`Webhook processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});
