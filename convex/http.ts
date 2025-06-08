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
  // The default path is /polar/events - make sure this matches your Polar webhook configuration
  onSubscriptionCreated: async (_ctx, event: any) => {
    console.log("=== Polar webhook: subscription created ===");
    console.log("Event type:", event.type);
    console.log("Event data:", JSON.stringify(event.data, null, 2));
    
    // The Polar component should handle user association internally
    // Let's log what we receive to debug
    const subscription = event.data;
    console.log("Subscription ID:", subscription?.id);
    console.log("Customer ID:", subscription?.customer_id);
    console.log("Product ID:", subscription?.product_id);
    console.log("Status:", subscription?.status);
    console.log("Metadata:", subscription?.metadata);
    
    // The Polar component should update the subscription automatically
    // based on the getUserInfo function we provided
    // If manual handling is needed, we can add it here
  },
  onSubscriptionUpdated: async (_ctx, event: any) => {
    console.log("=== Polar webhook: subscription updated ===");
    console.log("Event type:", event.type);
    console.log("Event data:", JSON.stringify(event.data, null, 2));
    
    const subscription = event.data;
    console.log("Subscription ID:", subscription?.id);
    console.log("Customer ID:", subscription?.customer_id);
    console.log("Product ID:", subscription?.product_id);
    console.log("Status:", subscription?.status);
    console.log("Metadata:", subscription?.metadata);
    
    // The Polar component should handle updates automatically
  },
});

export default http;
