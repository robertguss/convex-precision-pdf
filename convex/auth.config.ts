import { Auth } from "convex/server";

const authConfig = {
  providers: [
    {
      domain: process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL,
      applicationID: "convex",
    },
  ],
};

export default authConfig;

export const getAuthUserId = async (ctx: { auth: Auth }) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  // Clerk user IDs are passed in the subject field
  return identity.subject;
};
