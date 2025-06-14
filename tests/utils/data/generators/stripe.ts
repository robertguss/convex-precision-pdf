import { faker } from '@faker-js/faker';

// Stripe Customer interfaces
export interface MockStripeCustomer {
  id: string;
  object: 'customer';
  created: number;
  email: string;
  name?: string;
  metadata: Record<string, string>;
  default_source?: string;
  subscriptions?: {
    data: MockStripeSubscription[];
  };
}

// Stripe Subscription interfaces
export interface MockStripeSubscription {
  id: string;
  object: 'subscription';
  created: number;
  current_period_start: number;
  current_period_end: number;
  customer: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  cancel_at_period_end: boolean;
  items: {
    data: MockStripeSubscriptionItem[];
  };
  metadata: Record<string, string>;
}

export interface MockStripeSubscriptionItem {
  id: string;
  object: 'subscription_item';
  created: number;
  price: MockStripePrice;
  quantity: number;
  subscription: string;
}

// Stripe Price interfaces
export interface MockStripePrice {
  id: string;
  object: 'price';
  active: boolean;
  created: number;
  currency: string;
  metadata: Record<string, string>;
  nickname?: string;
  product: string;
  recurring?: {
    interval: 'month' | 'year';
    interval_count: number;
  };
  type: 'one_time' | 'recurring';
  unit_amount: number;
}

// Stripe Product interfaces
export interface MockStripeProduct {
  id: string;
  object: 'product';
  active: boolean;
  created: number;
  description?: string;
  metadata: Record<string, string>;
  name: string;
  type: 'service';
}

// Stripe Invoice interfaces
export interface MockStripeInvoice {
  id: string;
  object: 'invoice';
  created: number;
  customer: string;
  subscription: string | null;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  amount_due: number;
  amount_paid: number;
  currency: string;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  period_start: number;
  period_end: number;
  payment_intent?: {
    status: string;
  };
}

// Stripe Checkout Session interfaces
export interface MockStripeCheckoutSession {
  id: string;
  object: 'checkout.session';
  created: number;
  customer: string;
  mode: 'payment' | 'subscription' | 'setup';
  status: 'open' | 'complete' | 'expired';
  success_url: string;
  cancel_url: string;
  url?: string;
  subscription?: string;
  metadata: Record<string, string>;
}

// Stripe Webhook Event interfaces
export interface MockStripeWebhookEvent {
  id: string;
  object: 'event';
  created: number;
  type: string;
  data: {
    object: any;
    previous_attributes?: any;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key?: string;
  };
}

// Generator functions
export function generateStripeCustomer(overrides: Partial<MockStripeCustomer> = {}): MockStripeCustomer {
  const email = faker.internet.email();
  const name = faker.person.fullName();
  
  return {
    id: `cus_${faker.string.alphanumeric(14)}`,
    object: 'customer',
    created: faker.date.past().getTime() / 1000,
    email,
    name,
    metadata: {
      clerk_user_id: `user_${faker.string.alphanumeric(24)}`,
      ...overrides.metadata,
    },
    default_source: faker.helpers.maybe(() => `card_${faker.string.alphanumeric(14)}`),
    ...overrides,
  };
}

export function generateStripeSubscription(overrides: Partial<MockStripeSubscription> = {}): MockStripeSubscription {
  const created = faker.date.past().getTime() / 1000;
  const currentPeriodStart = faker.date.recent({ days: 30 }).getTime() / 1000;
  const currentPeriodEnd = faker.date.future({ days: 30 }).getTime() / 1000;
  
  return {
    id: `sub_${faker.string.alphanumeric(14)}`,
    object: 'subscription',
    created,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    customer: `cus_${faker.string.alphanumeric(14)}`,
    status: faker.helpers.arrayElement(['active', 'canceled', 'past_due', 'trialing']),
    cancel_at_period_end: faker.datatype.boolean(),
    items: {
      data: [generateStripeSubscriptionItem()],
    },
    metadata: {
      plan_name: faker.helpers.arrayElement(['pro', 'business']),
      ...overrides.metadata,
    },
    ...overrides,
  };
}

export function generateActiveStripeSubscription(overrides: Partial<MockStripeSubscription> = {}): MockStripeSubscription {
  return generateStripeSubscription({
    status: 'active',
    cancel_at_period_end: false,
    ...overrides,
  });
}

export function generateCanceledStripeSubscription(overrides: Partial<MockStripeSubscription> = {}): MockStripeSubscription {
  return generateStripeSubscription({
    status: 'canceled',
    cancel_at_period_end: true,
    ...overrides,
  });
}

export function generateStripeSubscriptionItem(overrides: Partial<MockStripeSubscriptionItem> = {}): MockStripeSubscriptionItem {
  return {
    id: `si_${faker.string.alphanumeric(14)}`,
    object: 'subscription_item',
    created: faker.date.past().getTime() / 1000,
    price: generateStripePrice(),
    quantity: 1,
    subscription: `sub_${faker.string.alphanumeric(14)}`,
    ...overrides,
  };
}

export function generateStripePrice(overrides: Partial<MockStripePrice> = {}): MockStripePrice {
  const planType = faker.helpers.arrayElement(['pro', 'business']);
  const isMonthly = faker.datatype.boolean();
  
  const priceMap = {
    pro: { monthly: 1900, yearly: 19000 },
    business: { monthly: 4900, yearly: 49000 },
  };
  
  return {
    id: `price_${faker.string.alphanumeric(14)}`,
    object: 'price',
    active: true,
    created: faker.date.past().getTime() / 1000,
    currency: 'usd',
    metadata: {
      plan: planType,
    },
    nickname: `${planType}-${isMonthly ? 'monthly' : 'yearly'}`,
    product: `prod_${faker.string.alphanumeric(14)}`,
    recurring: {
      interval: isMonthly ? 'month' : 'year',
      interval_count: 1,
    },
    type: 'recurring',
    unit_amount: priceMap[planType][isMonthly ? 'monthly' : 'yearly'],
    ...overrides,
  };
}

export function generateStripeProduct(overrides: Partial<MockStripeProduct> = {}): MockStripeProduct {
  const planName = faker.helpers.arrayElement(['Pro Plan', 'Business Plan']);
  
  return {
    id: `prod_${faker.string.alphanumeric(14)}`,
    object: 'product',
    active: true,
    created: faker.date.past().getTime() / 1000,
    description: `${planName} subscription for PrecisionPDF`,
    metadata: {},
    name: planName,
    type: 'service',
    ...overrides,
  };
}

export function generateStripeInvoice(overrides: Partial<MockStripeInvoice> = {}): MockStripeInvoice {
  const amountDue = faker.number.int({ min: 1900, max: 49000 });
  const status = faker.helpers.arrayElement(['draft', 'open', 'paid', 'uncollectible']);
  
  return {
    id: `in_${faker.string.alphanumeric(14)}`,
    object: 'invoice',
    created: faker.date.past().getTime() / 1000,
    customer: `cus_${faker.string.alphanumeric(14)}`,
    subscription: `sub_${faker.string.alphanumeric(14)}`,
    status,
    amount_due: amountDue,
    amount_paid: status === 'paid' ? amountDue : 0,
    currency: 'usd',
    hosted_invoice_url: `https://invoice.stripe.com/i/acct_test/test_${faker.string.alphanumeric(20)}`,
    invoice_pdf: `https://pay.stripe.com/invoice/${faker.string.alphanumeric(20)}/pdf`,
    period_start: faker.date.past().getTime() / 1000,
    period_end: faker.date.recent().getTime() / 1000,
    payment_intent: {
      status: faker.helpers.arrayElement(['succeeded', 'requires_payment_method', 'processing']),
    },
    ...overrides,
  };
}

export function generateStripeCheckoutSession(overrides: Partial<MockStripeCheckoutSession> = {}): MockStripeCheckoutSession {
  return {
    id: `cs_${faker.string.alphanumeric(14)}`,
    object: 'checkout.session',
    created: faker.date.recent().getTime() / 1000,
    customer: `cus_${faker.string.alphanumeric(14)}`,
    mode: 'subscription',
    status: 'complete',
    success_url: 'http://localhost:3000/dashboard?success=true',
    cancel_url: 'http://localhost:3000/dashboard',
    url: `https://checkout.stripe.com/c/pay/cs_${faker.string.alphanumeric(14)}`,
    subscription: `sub_${faker.string.alphanumeric(14)}`,
    metadata: {
      convexUserId: `user_${faker.string.alphanumeric(24)}`,
      planId: faker.helpers.arrayElement(['starter', 'pro', 'business']),
    },
    ...overrides,
  };
}

export function generateStripeWebhookEvent(eventType: string, data: any, overrides: Partial<MockStripeWebhookEvent> = {}): MockStripeWebhookEvent {
  return {
    id: `evt_${faker.string.alphanumeric(14)}`,
    object: 'event',
    created: faker.date.recent().getTime() / 1000,
    type: eventType,
    data: {
      object: data,
    },
    livemode: false,
    pending_webhooks: faker.number.int({ min: 0, max: 3 }),
    request: {
      id: `req_${faker.string.alphanumeric(14)}`,
      idempotency_key: faker.helpers.maybe(() => faker.string.uuid()),
    },
    ...overrides,
  };
}

// Common webhook event generators
export function generateCustomerSubscriptionCreatedEvent(subscription: MockStripeSubscription): MockStripeWebhookEvent {
  return generateStripeWebhookEvent('customer.subscription.created', subscription);
}

export function generateCustomerSubscriptionUpdatedEvent(subscription: MockStripeSubscription, previousAttributes?: any): MockStripeWebhookEvent {
  return generateStripeWebhookEvent('customer.subscription.updated', subscription, {
    data: {
      object: subscription,
      previous_attributes: previousAttributes,
    },
  });
}

export function generateCustomerSubscriptionDeletedEvent(subscription: MockStripeSubscription): MockStripeWebhookEvent {
  return generateStripeWebhookEvent('customer.subscription.deleted', subscription);
}

export function generateInvoicePaymentFailedEvent(invoice: MockStripeInvoice): MockStripeWebhookEvent {
  return generateStripeWebhookEvent('invoice.payment_failed', invoice);
}

export function generateInvoicePaymentSucceededEvent(invoice: MockStripeInvoice): MockStripeWebhookEvent {
  return generateStripeWebhookEvent('invoice.payment_succeeded', invoice);
}