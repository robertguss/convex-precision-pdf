/**
 * Subscription management page for handling Polar subscriptions
 */

'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    pages: 10,
    features: [
      '10 pages per month',
      'Basic document processing',
      'Export to JSON & Markdown',
      'Community support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$19',
    pages: 75,
    features: [
      '75 pages per month',
      'Priority processing',
      'Export to JSON & Markdown',
      'Email support',
      'Advanced extraction features',
    ],
    recommended: true,
  },
  {
    id: 'pro',
    name: 'Professional',
    price: '$49',
    pages: 250,
    features: [
      '250 pages per month',
      'Fastest processing',
      'Export to JSON & Markdown',
      'Priority email support',
      'Advanced extraction features',
      'API access (coming soon)',
    ],
  },
];

export default function SubscriptionPage() {
  const subscription = useQuery(api.polar.getUserSubscription);
  const checkoutLink = useMutation(api.polar.createCheckoutLink);
  const managePortalLink = useMutation(api.polar.createCustomerPortalLink);
  
  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return; // Free plan doesn't need checkout
    
    try {
      const { url } = await checkoutLink({ productKey: planId });
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout link:', error);
    }
  };
  
  const handleManageSubscription = async () => {
    try {
      const { url } = await managePortalLink();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create portal link:', error);
    }
  };
  
  if (!subscription) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading subscription...</div>
      </div>
    );
  }
  
  const currentPlanId = subscription.tier;
  const resetDate = subscription.creditsResetDate 
    ? new Date(subscription.creditsResetDate).toLocaleDateString()
    : null;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Subscription & Credits</h1>
        <p className="text-gray-600">
          Manage your subscription and track your credit usage
        </p>
      </div>
      
      {/* Current Usage Card */}
      <Card className="mb-8 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>Your credit usage for this billing period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Pages Used</span>
                <span className="text-sm font-medium">
                  {subscription.creditsUsed} / {subscription.creditsLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all",
                    subscription.creditsUsed / subscription.creditsLimit > 0.8
                      ? "bg-red-500"
                      : subscription.creditsUsed / subscription.creditsLimit > 0.5
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  )}
                  style={{ width: `${(subscription.creditsUsed / subscription.creditsLimit) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Plan</span>
              <Badge variant={currentPlanId === 'free' ? 'secondary' : 'default'}>
                {currentPlanId.charAt(0).toUpperCase() + currentPlanId.slice(1)}
              </Badge>
            </div>
            
            {resetDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Credits Reset</span>
                <span>{resetDate}</span>
              </div>
            )}
          </div>
          
          {subscription.status !== 'free' && (
            <Button 
              onClick={handleManageSubscription}
              variant="outline" 
              className="w-full mt-4"
            >
              Manage Subscription
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={cn(
              "relative",
              plan.recommended && "border-primary shadow-lg",
              currentPlanId === plan.id && "bg-gray-50"
            )}
          >
            {plan.recommended && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                Recommended
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-600">/month</span>
              </div>
              <CardDescription className="mt-2">
                {plan.pages} pages per month
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {currentPlanId === plan.id ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button 
                  onClick={() => handleUpgrade(plan.id)}
                  variant={plan.recommended ? "default" : "outline"}
                  className="w-full"
                >
                  {currentPlanId === 'free' && plan.id !== 'free' ? 'Upgrade' : 'Switch'} to {plan.name}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}