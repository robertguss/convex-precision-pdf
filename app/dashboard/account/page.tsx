"use client";

import { useRouter } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function AccountPage() {
  const router = useRouter();
  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const pageUsage = useQuery(api.subscriptions.getUserPageUsage);
  const createPortalSession = useAction(api.stripe.createPortalSession);

  const handleManageSubscription = async () => {
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error("Error creating portal session:", error);
    }
  };

  if (!subscription || !pageUsage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isFreePlan = !subscription.stripeSubscriptionId;
  const nextBillingDate = subscription.currentPeriodEnd 
    ? new Date(subscription.currentPeriodEnd)
    : null;

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <div className="space-y-6">
        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Manage your subscription and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-xl font-semibold" data-cy="subscription-plan">
                  {subscription.plan?.name || "Free Plan"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground" data-cy="subscription-status">
                  {subscription.status === "active" ? "Active" : 
                   subscription.status === "past_due" ? "Past due" :
                   subscription.status === "canceled" ? "Canceled" :
                   subscription.status === "incomplete" ? "Incomplete" : "Active"}
                </p>
                {nextBillingDate && !subscription.cancelAtPeriodEnd && (
                  <p className="text-sm" data-cy="next-billing-date">
                    Next billing: {format(nextBillingDate, "PPP")}
                  </p>
                )}
                {subscription.cancelAtPeriodEnd && (
                  <p className="text-sm text-warning" data-cy="cancellation-date">
                    Cancels on: {format(nextBillingDate!, "PPP")}
                  </p>
                )}
              </div>
            </div>

            {/* Credit Usage */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Page Credits</p>
                  <p className="text-lg">
                    <span data-cy="credits-used">{pageUsage.used}</span> / 
                    <span data-cy="credits-limit">{pageUsage.limit}</span> used
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold" data-cy="credits-remaining">
                    {pageUsage.remaining} remaining
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              {isFreePlan ? (
                <Button
                  onClick={() => router.push("/dashboard/upgrade")}
                  className="flex-1"
                  data-cy="upgrade-subscription"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Upgrade Subscription
                </Button>
              ) : (
                <Button
                  onClick={handleManageSubscription}
                  className="flex-1"
                  variant="outline"
                  data-cy="manage-subscription"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Subscription
                </Button>
              )}
            </div>

            {subscription.status === "past_due" && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md" data-cy="payment-failed-banner">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">
                  Your payment failed. Please update your payment method.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManageSubscription}
                  className="ml-auto"
                  data-cy="update-payment-method"
                >
                  Update Payment
                </Button>
              </div>
            )}

            {subscription.cancelAtPeriodEnd && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-md" data-cy="subscription-ending-notice">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">
                  Your subscription is scheduled to cancel at the end of the billing period.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManageSubscription}
                  className="ml-auto"
                  data-cy="reactivate-before-cancellation"
                >
                  Reactivate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>View your payment history and invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {isFreePlan ? (
              <p className="text-sm text-muted-foreground">
                No billing history available for free accounts.
              </p>
            ) : (
              <Button
                onClick={handleManageSubscription}
                variant="outline"
                data-cy="payment-history"
              >
                <Calendar className="mr-2 h-4 w-4" />
                View Payment History
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Credit History */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Usage History</CardTitle>
            <CardDescription>Track your monthly credit usage</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/dashboard/credits")}
              variant="outline"
              data-cy="credit-history"
            >
              View Credit History
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}