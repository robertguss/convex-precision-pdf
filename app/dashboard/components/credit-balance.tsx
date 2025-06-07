// ABOUTME: Component to display user's current credit balance
// ABOUTME: Shows remaining credits and provides visual feedback for low balance

'use client';

import { Badge } from '@kit/ui/badge';
import { cn } from '@kit/ui/utils';

import { useCredits } from '~/lib/hooks/use-credits';

// ABOUTME: Component to display user's current credit balance
// ABOUTME: Shows remaining credits and provides visual feedback for low balance

interface CreditBalanceProps {
  isDemo?: boolean;
}

export function CreditBalance({ isDemo = false }: CreditBalanceProps) {
  const { data, isLoading, error } = useCredits();

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

  if (isLoading) {
    return (
      <Badge variant="secondary" className="animate-pulse">
        Loading credits...
      </Badge>
    );
  }

  if (error || !data) {
    return null;
  }

  const { credits } = data;
  const isLow = credits < 10;
  const isEmpty = credits === 0;

  return (
    <Badge
      variant={isEmpty ? 'destructive' : isLow ? 'warning' : 'default'}
      className={cn('font-semibold', isEmpty && 'animate-pulse')}
    >
      {isEmpty ? (
        'No credits remaining'
      ) : (
        <>
          {credits} credit{credits !== 1 ? 's' : ''} remaining
        </>
      )}
    </Badge>
  );
}
