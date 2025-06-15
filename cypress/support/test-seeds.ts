/**
 * Test data seeding utilities for payment E2E tests
 * 
 * These utilities create realistic test data for payment flow testing
 */

import { testUsers } from './test-data';

// Stripe test webhook secret for verifying webhooks in test mode
export const STRIPE_TEST_WEBHOOK_SECRET = 'whsec_test_secret';

/**
 * Creates test user data with proper Clerk and Stripe IDs
 */
export function createTestUserData(tier: 'free' | 'pro' | 'business') {
  const baseUser = testUsers[`${tier}User`];
  const timestamp = Date.now();
  
  return {
    clerkId: `user_test_${tier}_${timestamp}`,
    email: baseUser.email,
    name: baseUser.name,
    imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${tier}`,
    subscription: tier === 'free' ? null : {
      planId: tier,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false,
    },
    stripeCustomerId: tier === 'free' ? null : `cus_test_${tier}_${timestamp}`,
    stripeSubscriptionId: tier === 'free' ? null : `sub_test_${tier}_${timestamp}`,
    credits: tier === 'free' ? 3 : (tier === 'pro' ? 50 : 200),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Creates test subscription data for Stripe
 */
export function createTestSubscriptionData(tier: 'pro' | 'business', customerId: string) {
  const priceId = tier === 'pro' 
    ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_test_pro'
    : process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || 'price_test_business';
  
  return {
    id: `sub_test_${Date.now()}`,
    customer: customerId,
    items: {
      data: [{
        id: `si_test_${Date.now()}`,
        price: {
          id: priceId,
          product: `prod_test_${tier}`,
          unit_amount: tier === 'pro' ? 1900 : 4900, // $19 or $49
          currency: 'usd',
          recurring: {
            interval: 'month',
            interval_count: 1,
          },
        },
      }],
    },
    status: 'active',
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    cancel_at_period_end: false,
    metadata: {
      planId: tier,
    },
  };
}

/**
 * Creates test invoice data for renewal testing
 */
export function createTestInvoiceData(subscriptionId: string, customerId: string, amount: number) {
  return {
    id: `in_test_${Date.now()}`,
    subscription: subscriptionId,
    customer: customerId,
    amount_paid: amount,
    amount_due: amount,
    currency: 'usd',
    status: 'paid',
    paid: true,
    lines: {
      data: [{
        amount: amount,
        description: 'Subscription renewal',
      }],
    },
    payment_intent: `pi_test_${Date.now()}`,
    hosted_invoice_url: `https://invoice.stripe.com/i/test_${Date.now()}`,
  };
}

/**
 * Creates test payment method data
 */
export function createTestPaymentMethodData(customerId: string, last4 = '4242') {
  return {
    id: `pm_test_${Date.now()}`,
    customer: customerId,
    type: 'card',
    card: {
      brand: 'visa',
      last4: last4,
      exp_month: 12,
      exp_year: 2030,
    },
  };
}

/**
 * Creates test webhook event data
 */
export function createTestWebhookEvent(type: string, data: any) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: timestamp,
    data: {
      object: data,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: null,
      idempotency_key: null,
    },
    type: type,
  });
  
  // Create test signature
  const signature = `t=${timestamp},v1=test_signature_${Date.now()}`;
  
  return {
    payload,
    signature,
    headers: {
      'stripe-signature': signature,
    },
  };
}

/**
 * Test document data for credit consumption testing
 */
export function createTestDocumentData(userId: string, pageCount: number) {
  return {
    userId,
    title: `Test Document ${Date.now()}`,
    filename: `test-doc-${Date.now()}.pdf`,
    pageCount,
    status: 'completed',
    chunks: Array.from({ length: Math.ceil(pageCount * 2.5) }, (_, i) => ({
      index: i,
      text: `Test chunk ${i} content...`,
      pageNumber: Math.floor(i / 2.5),
    })),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Creates credit transaction data
 */
export function createCreditTransactionData(userId: string, amount: number, type: 'debit' | 'credit') {
  return {
    userId,
    amount: type === 'debit' ? -amount : amount,
    type,
    description: type === 'debit' ? 'Document processing' : 'Subscription renewal',
    balance: 0, // Will be calculated
    createdAt: new Date(),
  };
}

/**
 * Helper to generate Stripe-style IDs
 */
export function generateStripeId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${id}`;
}

/**
 * Helper to simulate Stripe API responses
 */
export function mockStripeResponse(data: any, status = 200) {
  return {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      'content-type': 'application/json',
      'stripe-version': '2023-10-16',
    },
    body: JSON.stringify(data),
  };
}

/**
 * Test scenario data for different payment flows
 */
export const paymentScenarios = {
  successfulUpgrade: {
    card: '4242424242424242',
    expectedStatus: 'succeeded',
    expectedAmount: 1900, // $19 for Pro
  },
  declinedCard: {
    card: '4000000000000002',
    expectedStatus: 'failed',
    expectedError: 'Your card was declined.',
  },
  insufficientFunds: {
    card: '4000000000009995',
    expectedStatus: 'failed',
    expectedError: 'Your card has insufficient funds.',
  },
  expiredCard: {
    card: '4000000000000069',
    expectedStatus: 'failed',
    expectedError: 'Your card has expired.',
  },
  requires3DS: {
    card: '4000002500003155',
    expectedStatus: 'requires_action',
    expected3DS: true,
  },
  requires3DSAlwaysFails: {
    card: '4000008400001629',
    expectedStatus: 'failed',
    expectedError: 'We could not authenticate your payment method.',
  },
};