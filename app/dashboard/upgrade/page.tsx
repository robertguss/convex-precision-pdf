"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function UpgradePage() {
  const router = useRouter();
  const plans = useQuery(api.plans.list);
  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const createCheckoutSession = useMutation(api.stripe.createCheckoutSession);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    try {
      setLoadingPlanId(planId);
      const { url } = await createCheckoutSession({ planId });
      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setLoadingPlanId(null);
    }
  };

  if (!plans) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const currentPlanId = subscription?.planId || "free";

  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="text-muted-foreground mt-2">
          Select the plan that best fits your document processing needs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const isFree = plan.id === "free";
          
          return (
            <Card 
              key={plan.id} 
              className={plan.popular ? "border-primary shadow-lg" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.popular && (
                    <Badge variant="default">Popular</Badge>
                  )}
                  {isCurrentPlan && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                  ${(plan.price / 100).toFixed(2)}
                  <span className="text-base font-normal text-muted-foreground">
                    /{plan.interval}
                  </span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrentPlan ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : isFree ? (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                  >
                    Continue with Free
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loadingPlanId !== null}
                  >
                    {loadingPlanId === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Upgrade Now"
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}