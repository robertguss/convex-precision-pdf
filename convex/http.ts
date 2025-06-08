import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";
import { polar } from "./polar";

const http = httpRouter();

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error occured", { status: 400 });
    }
    switch (event.type) {
      case "user.created": // intentional fallthrough
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });
        break;

      case "user.deleted": {
        const clerkUserId = event.data.id!;
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
        break;
      }
      default:
        console.log("Ignored Clerk webhook event", event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

// Register Polar webhook routes
polar.registerRoutes(http, {
  onSubscriptionCreated: async (ctx, event: any) => {
    // Handle new subscription
    if (event.data?.metadata?.userId) {
      const subscription = event.data;
      await ctx.runMutation(internal.polar.updateUserSubscription, {
        userId: subscription.metadata.userId as any,
        subscriptionId: subscription.id,
        status: subscription.status,
        productKey: subscription.product.key || 'starter',
        polarCustomerId: subscription.customer_id,
      });
    }
  },
  onSubscriptionUpdated: async (ctx, event: any) => {
    // Handle subscription updates
    if (event.data?.metadata?.userId) {
      const subscription = event.data;
      await ctx.runMutation(internal.polar.updateUserSubscription, {
        userId: subscription.metadata.userId as any,
        subscriptionId: subscription.id,
        status: subscription.status,
        productKey: subscription.product.key || 'starter',
        polarCustomerId: subscription.customer_id,
      });
    }
  },
});

export default http;
