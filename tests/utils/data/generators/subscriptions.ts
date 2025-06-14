import { faker } from '@faker-js/faker';
import { Id } from '../../../../convex/_generated/dataModel';

export interface MockSubscription {
  _id: Id<'subscriptions'>;
  _creationTime: number;
  userId: Id<'users'>;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  planId: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

export interface MockPlan {
  _id: Id<'plans'>;
  _creationTime: number;
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  stripePriceId: string;
  features: string[];
  popular?: boolean;
}

export interface MockPageUsage {
  _id: Id<'pageUsage'>;
  _creationTime: number;
  userId: Id<'users'>;
  documentId: Id<'documents'>;
  pageCount: number;
  processedAt: number;
  billingCycleStart: number;
  billingCycleEnd: number;
}

// Plan generators
export function generateFreePlan(overrides: Partial<MockPlan> = {}): MockPlan {
  return {
    _id: faker.string.uuid() as Id<'plans'>,
    _creationTime: faker.date.past().getTime(),
    id: 'free',
    name: 'Free Plan',
    description: 'Perfect for trying out PrecisionPDF',
    price: 0,
    interval: 'month',
    stripePriceId: 'price_free',
    features: [
      '10 pages per month',
      'Basic PDF processing',
      'Standard export formats',
      'Email support',
    ],
    popular: false,
    ...overrides,
  };
}

export function generateProPlan(overrides: Partial<MockPlan> = {}): MockPlan {
  return {
    _id: faker.string.uuid() as Id<'plans'>,
    _creationTime: faker.date.past().getTime(),
    id: 'pro',
    name: 'Pro Plan',
    description: 'Ideal for professionals and small teams',
    price: 1900,
    interval: 'month',
    stripePriceId: `price_${faker.string.alphanumeric(14)}`,
    features: [
      '100 pages per month',
      'Advanced PDF processing',
      'All export formats',
      'Priority support',
      'API access',
    ],
    popular: true,
    ...overrides,
  };
}

export function generateBusinessPlan(overrides: Partial<MockPlan> = {}): MockPlan {
  return {
    _id: faker.string.uuid() as Id<'plans'>,
    _creationTime: faker.date.past().getTime(),
    id: 'business',
    name: 'Business Plan',
    description: 'Perfect for growing businesses and teams',
    price: 4900,
    interval: 'month',
    stripePriceId: `price_${faker.string.alphanumeric(14)}`,
    features: [
      '500 pages per month',
      'Enterprise PDF processing',
      'All export formats',
      'Priority support',
      'Full API access',
      'Custom integrations',
      'Team management',
    ],
    popular: false,
    ...overrides,
  };
}

export function generateYearlyProPlan(overrides: Partial<MockPlan> = {}): MockPlan {
  return generateProPlan({
    id: 'pro-yearly',
    name: 'Pro Plan (Yearly)',
    price: 19000,
    interval: 'year',
    stripePriceId: `price_${faker.string.alphanumeric(14)}`,
    ...overrides,
  });
}

export function generateYearlyBusinessPlan(overrides: Partial<MockPlan> = {}): MockPlan {
  return generateBusinessPlan({
    id: 'business-yearly',
    name: 'Business Plan (Yearly)',
    price: 49000,
    interval: 'year',
    stripePriceId: `price_${faker.string.alphanumeric(14)}`,
    ...overrides,
  });
}

// Subscription generators
export function generateSubscription(overrides: Partial<MockSubscription> = {}): MockSubscription {
  const currentPeriodStart = faker.date.recent({ days: 30 }).getTime();
  const currentPeriodEnd = faker.date.future({ days: 30 }).getTime();
  
  return {
    _id: faker.string.uuid() as Id<'subscriptions'>,
    _creationTime: faker.date.past().getTime(),
    userId: faker.string.uuid() as Id<'users'>,
    stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
    stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
    status: faker.helpers.arrayElement(['active', 'canceled', 'past_due', 'trialing', 'incomplete']),
    planId: faker.helpers.arrayElement(['pro', 'business']),
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: faker.datatype.boolean(),
    ...overrides,
  };
}

export function generateActiveSubscription(overrides: Partial<MockSubscription> = {}): MockSubscription {
  return generateSubscription({
    status: 'active',
    cancelAtPeriodEnd: false,
    ...overrides,
  });
}

export function generateCanceledSubscription(overrides: Partial<MockSubscription> = {}): MockSubscription {
  return generateSubscription({
    status: 'canceled',
    cancelAtPeriodEnd: true,
    currentPeriodEnd: faker.date.past().getTime(),
    ...overrides,
  });
}

export function generateTrialingSubscription(overrides: Partial<MockSubscription> = {}): MockSubscription {
  return generateSubscription({
    status: 'trialing',
    cancelAtPeriodEnd: false,
    currentPeriodEnd: faker.date.future({ days: 14 }).getTime(),
    ...overrides,
  });
}

export function generatePastDueSubscription(overrides: Partial<MockSubscription> = {}): MockSubscription {
  return generateSubscription({
    status: 'past_due',
    cancelAtPeriodEnd: false,
    currentPeriodEnd: faker.date.past({ days: 7 }).getTime(),
    ...overrides,
  });
}

export function generateProSubscription(overrides: Partial<MockSubscription> = {}): MockSubscription {
  return generateActiveSubscription({
    planId: 'pro',
    ...overrides,
  });
}

export function generateBusinessSubscription(overrides: Partial<MockSubscription> = {}): MockSubscription {
  return generateActiveSubscription({
    planId: 'business',
    ...overrides,
  });
}

export function generateSubscriptionForUser(userId: Id<'users'>, overrides: Partial<MockSubscription> = {}): MockSubscription {
  return generateSubscription({
    userId,
    ...overrides,
  });
}

// Page usage generators
export function generatePageUsage(overrides: Partial<MockPageUsage> = {}): MockPageUsage {
  const processedAt = faker.date.recent({ days: 30 }).getTime();
  const billingCycleStart = faker.date.past({ days: 30 }).getTime();
  const billingCycleEnd = faker.date.future({ days: 30 }).getTime();
  
  return {
    _id: faker.string.uuid() as Id<'pageUsage'>,
    _creationTime: processedAt,
    userId: faker.string.uuid() as Id<'users'>,
    documentId: faker.string.uuid() as Id<'documents'>,
    pageCount: faker.number.int({ min: 1, max: 50 }),
    processedAt,
    billingCycleStart,
    billingCycleEnd,
    ...overrides,
  };
}

export function generatePageUsageForUser(userId: Id<'users'>, overrides: Partial<MockPageUsage> = {}): MockPageUsage {
  return generatePageUsage({
    userId,
    ...overrides,
  });
}

export function generatePageUsageForDocument(documentId: Id<'documents'>, overrides: Partial<MockPageUsage> = {}): MockPageUsage {
  return generatePageUsage({
    documentId,
    ...overrides,
  });
}

export function generateMultiplePageUsages(count: number, overrides: Partial<MockPageUsage> = {}): MockPageUsage[] {
  return Array.from({ length: count }, () => generatePageUsage(overrides));
}

export function generatePageUsageWithinCycle(
  billingCycleStart: number,
  billingCycleEnd: number,
  overrides: Partial<MockPageUsage> = {}
): MockPageUsage {
  return generatePageUsage({
    billingCycleStart,
    billingCycleEnd,
    processedAt: faker.date.between({
      from: new Date(billingCycleStart),
      to: new Date(billingCycleEnd),
    }).getTime(),
    ...overrides,
  });
}

// Utility functions for creating complete user scenarios
export function generateUserWithSubscription(planId: 'pro' | 'business' = 'pro') {
  const userId = faker.string.uuid() as Id<'users'>;
  
  const subscription = generateActiveSubscription({
    userId,
    planId,
  });
  
  return {
    userId,
    subscription,
  };
}

export function generateFreeUserScenario() {
  const userId = faker.string.uuid() as Id<'users'>;
  
  return {
    userId,
    subscription: null,
  };
}

export function generateCanceledUserScenario() {
  const userId = faker.string.uuid() as Id<'users'>;
  
  const subscription = generateCanceledSubscription({
    userId,
  });
  
  return {
    userId,
    subscription,
  };
}