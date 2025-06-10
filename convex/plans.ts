import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("plans").collect();
  },
});

export const seedPlans = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if plans already exist
    const existingPlans = await ctx.db.query("plans").collect();
    if (existingPlans.length > 0) {
      return "Plans already seeded";
    }

    const plans = [
      {
        id: "free",
        name: "Free",
        description: "Perfect for getting started",
        price: 0,
        interval: "month",
        stripePriceId: "price_1RVxfg4Qp58g8uFw6KhUsp9J",
        features: ["10 pages per month"],
      },
      {
        id: "starter",
        name: "Starter",
        description: "For growing businesses",
        price: 999, // $9.99
        interval: "month",
        stripePriceId: "price_1RVxgR4Qp58g8uFwKTF0M73d",
        features: ["75 pages every month"],
        popular: true,
      },
      {
        id: "pro",
        name: "Pro",
        description: "For large organizations",
        price: 2499, // $24.99
        interval: "month",
        stripePriceId: "price_1RVxgx4Qp58g8uFwO8Eyjre3",
        features: ["250 pages every month"],
      },
    ];

    for (const plan of plans) {
      await ctx.db.insert("plans", plan);
    }

    return "Plans seeded successfully";
  },
});
