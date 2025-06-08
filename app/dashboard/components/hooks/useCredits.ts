/**
 * Hook for accessing user's credit/subscription information
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useCredits() {
  const subscription = useQuery(api.polar.getUserSubscription);
  
  const isLoading = subscription === undefined;
  const error = subscription === null ? new Error("Failed to load subscription") : null;
  
  return {
    data: subscription ? {
      credits: subscription.creditsRemaining,
      creditsUsed: subscription.creditsUsed,
      creditsLimit: subscription.creditsLimit,
      tier: subscription.tier,
      status: subscription.status,
      creditsResetDate: subscription.creditsResetDate,
    } : null,
    isLoading,
    error,
  };
}