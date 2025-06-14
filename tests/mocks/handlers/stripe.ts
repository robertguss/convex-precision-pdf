import { http, HttpResponse } from 'msw'

/**
 * Mock Stripe API responses for unit testing
 * Note: Integration and E2E tests should use real Stripe test mode
 */

export const DEFAULT_MOCK_CUSTOMER = {
  id: 'cus_test123',
  object: 'customer',
  created: Math.floor(Date.now() / 1000),
  email: 'test@example.com',
  name: 'Test User',
  metadata: {
    clerk_user_id: 'user_test123'
  },
  default_source: null,
  subscriptions: {
    object: 'list',
    data: [],
    has_more: false,
    total_count: 0,
    url: '/v1/customers/cus_test123/subscriptions'
  }
}

export const DEFAULT_MOCK_SUBSCRIPTION = {
  id: 'sub_test123',
  object: 'subscription',
  created: Math.floor(Date.now() / 1000),
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
  customer: 'cus_test123',
  status: 'active',
  items: {
    object: 'list',
    data: [
      {
        id: 'si_test123',
        object: 'subscription_item',
        price: {
          id: 'price_pro_monthly',
          object: 'price',
          active: true,
          billing_scheme: 'per_unit',
          created: Math.floor(Date.now() / 1000),
          currency: 'usd',
          metadata: {},
          nickname: 'Pro Plan',
          product: 'prod_pro',
          recurring: {
            interval: 'month',
            interval_count: 1
          },
          unit_amount: 2900,
          unit_amount_decimal: '2900'
        },
        quantity: 1
      }
    ]
  },
  metadata: {
    plan_id: 'pro'
  }
}

export const DEFAULT_MOCK_CHECKOUT_SESSION = {
  id: 'cs_test123',
  object: 'checkout.session',
  created: Math.floor(Date.now() / 1000),
  customer: 'cus_test123',
  mode: 'subscription',
  payment_status: 'paid',
  status: 'complete',
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel',
  url: 'https://checkout.stripe.com/pay/cs_test123'
}

export const stripeHandlers = [
  /**
   * Mock customer creation
   */
  http.post('*/v1/customers', async ({ request }) => {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    return HttpResponse.json({
      ...DEFAULT_MOCK_CUSTOMER,
      email: params.get('email') || DEFAULT_MOCK_CUSTOMER.email,
      name: params.get('name') || DEFAULT_MOCK_CUSTOMER.name,
      metadata: {
        clerk_user_id: params.get('metadata[clerk_user_id]') || 'user_test123'
      }
    })
  }),

  /**
   * Mock customer retrieval
   */
  http.get('*/v1/customers/:customerId', ({ params }) => {
    return HttpResponse.json({
      ...DEFAULT_MOCK_CUSTOMER,
      id: params.customerId as string
    })
  }),

  /**
   * Mock customer update
   */
  http.post('*/v1/customers/:customerId', async ({ params, request }) => {
    const body = await request.text()
    const updateParams = new URLSearchParams(body)
    
    return HttpResponse.json({
      ...DEFAULT_MOCK_CUSTOMER,
      id: params.customerId as string,
      email: updateParams.get('email') || DEFAULT_MOCK_CUSTOMER.email,
      name: updateParams.get('name') || DEFAULT_MOCK_CUSTOMER.name
    })
  }),

  /**
   * Mock subscription creation
   */
  http.post('*/v1/subscriptions', async ({ request }) => {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    return HttpResponse.json({
      ...DEFAULT_MOCK_SUBSCRIPTION,
      customer: params.get('customer') || DEFAULT_MOCK_CUSTOMER.id,
      metadata: {
        plan_id: params.get('metadata[plan_id]') || 'pro'
      }
    })
  }),

  /**
   * Mock subscription retrieval
   */
  http.get('*/v1/subscriptions/:subscriptionId', ({ params }) => {
    return HttpResponse.json({
      ...DEFAULT_MOCK_SUBSCRIPTION,
      id: params.subscriptionId as string
    })
  }),

  /**
   * Mock subscription update/cancellation
   */
  http.post('*/v1/subscriptions/:subscriptionId', async ({ params, request }) => {
    const body = await request.text()
    const updateParams = new URLSearchParams(body)
    
    const cancelAtPeriodEnd = updateParams.get('cancel_at_period_end')
    
    return HttpResponse.json({
      ...DEFAULT_MOCK_SUBSCRIPTION,
      id: params.subscriptionId as string,
      cancel_at_period_end: cancelAtPeriodEnd === 'true',
      status: cancelAtPeriodEnd === 'true' ? 'active' : 'active'
    })
  }),

  /**
   * Mock checkout session creation
   */
  http.post('*/v1/checkout/sessions', async ({ request }) => {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    return HttpResponse.json({
      ...DEFAULT_MOCK_CHECKOUT_SESSION,
      customer: params.get('customer'),
      success_url: params.get('success_url') || DEFAULT_MOCK_CHECKOUT_SESSION.success_url,
      cancel_url: params.get('cancel_url') || DEFAULT_MOCK_CHECKOUT_SESSION.cancel_url
    })
  }),

  /**
   * Mock customer portal session creation
   */
  http.post('*/v1/billing_portal/sessions', async ({ request }) => {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    return HttpResponse.json({
      id: 'bps_test123',
      object: 'billing_portal.session',
      created: Math.floor(Date.now() / 1000),
      customer: params.get('customer'),
      return_url: params.get('return_url'),
      url: 'https://billing.stripe.com/session/bps_test123'
    })
  }),

  /**
   * Mock webhook endpoint (for testing webhook handlers)
   */
  http.post('*/webhooks/stripe', async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      received: true,
      event_type: body.type,
      timestamp: Date.now()
    })
  }),

  /**
   * Mock prices list
   */
  http.get('*/v1/prices', () => {
    return HttpResponse.json({
      object: 'list',
      data: [
        {
          id: 'price_free',
          object: 'price',
          active: true,
          currency: 'usd',
          metadata: { plan_id: 'free' },
          nickname: 'Free Plan',
          product: 'prod_free',
          recurring: null,
          unit_amount: 0
        },
        {
          id: 'price_pro_monthly',
          object: 'price',
          active: true,
          currency: 'usd',
          metadata: { plan_id: 'pro' },
          nickname: 'Pro Plan',
          product: 'prod_pro',
          recurring: {
            interval: 'month',
            interval_count: 1
          },
          unit_amount: 2900
        },
        {
          id: 'price_business_monthly',
          object: 'price',
          active: true,
          currency: 'usd',
          metadata: { plan_id: 'business' },
          nickname: 'Business Plan',
          product: 'prod_business',
          recurring: {
            interval: 'month',
            interval_count: 1
          },
          unit_amount: 9900
        }
      ],
      has_more: false
    })
  })
]

/**
 * Helper functions for test scenarios
 */
export const stripeMockHelpers = {
  /**
   * Create a mock customer with custom properties
   */
  mockCustomer: (overrides: Partial<typeof DEFAULT_MOCK_CUSTOMER> = {}) => ({
    ...DEFAULT_MOCK_CUSTOMER,
    ...overrides
  }),

  /**
   * Create a mock subscription with custom properties
   */
  mockSubscription: (overrides: Partial<typeof DEFAULT_MOCK_SUBSCRIPTION> = {}) => ({
    ...DEFAULT_MOCK_SUBSCRIPTION,
    ...overrides
  }),

  /**
   * Mock a subscription in canceled state
   */
  mockCanceledSubscription: () => ({
    ...DEFAULT_MOCK_SUBSCRIPTION,
    status: 'canceled',
    canceled_at: Math.floor(Date.now() / 1000),
    cancel_at_period_end: false
  }),

  /**
   * Mock a failed payment
   */
  mockPaymentFailed: () => {
    return http.post('*/v1/subscriptions', () => {
      return HttpResponse.json(
        { error: { message: 'Your card was declined.' } },
        { status: 402 }
      )
    })
  }
}