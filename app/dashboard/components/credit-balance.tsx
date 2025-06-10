'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface CreditBalanceProps {
  isDemo?: boolean;
}

export function CreditBalance({ isDemo = false }: CreditBalanceProps) {
  const pageUsage = useQuery(api.subscriptions.getUserPageUsage);

  // Show demo mode badge if in demo
  if (isDemo) {
    return (
      <Badge variant="secondary" className="font-semibold">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          Demo Mode
        </div>
      </Badge>
    );
  }

  if (!pageUsage) {
    return (
      <Badge variant="secondary" className="animate-pulse">
        Loading...
      </Badge>
    );
  }

  const { remaining, used, limit } = pageUsage;
  const percentageUsed = limit > 0 ? (used / limit) * 100 : 0;
  const isLow = remaining < 5;
  const isEmpty = remaining === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Pages remaining</span>
        <Badge
          variant={isEmpty ? 'destructive' : isLow ? 'warning' : 'default'}
          className={isEmpty ? 'animate-pulse' : ''}
        >
          {remaining} pages
        </Badge>
      </div>
      <Progress value={percentageUsed} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {used} of {limit} pages used
      </p>
    </div>
  );
}
