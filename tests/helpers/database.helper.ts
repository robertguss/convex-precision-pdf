/**
 * Database helper functions for Playwright tests
 * Handles test data setup, teardown, and database operations
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

// Initialize Convex client for test operations
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3210';
const convex = new ConvexHttpClient(convexUrl);

/**
 * Test user configurations
 */
export const testUserConfigs = {
  free: {
    id: 'test-user-free',
    email: 'free.user@test.precisionpdf.com',
    name: 'Free Test User',
    clerkId: 'user_test_free',
    plan: 'free',
    credits: 3,
  },
  pro: {
    id: 'test-user-pro',
    email: 'pro.user@test.precisionpdf.com',
    name: 'Pro Test User',
    clerkId: 'user_test_pro',
    plan: 'pro',
    credits: 50,
    stripeCustomerId: 'cus_test_pro',
    stripeSubscriptionId: 'sub_test_pro',
  },
  business: {
    id: 'test-user-business',
    email: 'business.user@test.precisionpdf.com',
    name: 'Business Test User',
    clerkId: 'user_test_business',
    plan: 'business',
    credits: 500,
    stripeCustomerId: 'cus_test_business',
    stripeSubscriptionId: 'sub_test_business',
  },
};

/**
 * Reset database to clean state
 */
export async function resetDatabase() {
  try {
    // This would call a test-only mutation in Convex
    // For now, we'll log the action
    console.log('Resetting database for tests');
    
    // In a real implementation:
    // await convex.mutation(api.test.resetDatabase);
    
    return true;
  } catch (error) {
    console.error('Failed to reset database:', error);
    throw error;
  }
}

/**
 * Seed test users with different subscription tiers
 */
export async function seedTestUsers() {
  try {
    console.log('Seeding test users');
    
    // In a real implementation:
    // for (const [tier, config] of Object.entries(testUserConfigs)) {
    //   await convex.mutation(api.test.createTestUser, config);
    // }
    
    return true;
  } catch (error) {
    console.error('Failed to seed test users:', error);
    throw error;
  }
}

/**
 * Create test documents for a user
 */
export async function createTestDocuments(userId: string, count: number) {
  try {
    console.log(`Creating ${count} test documents for user ${userId}`);
    
    const documents = [];
    for (let i = 0; i < count; i++) {
      const doc = {
        name: `Test Document ${i + 1}`,
        userId,
        status: 'completed',
        pageCount: 10,
        chunkCount: 25,
        // In real implementation:
        // await convex.mutation(api.test.createTestDocument, doc);
      };
      documents.push(doc);
    }
    
    return documents;
  } catch (error) {
    console.error('Failed to create test documents:', error);
    throw error;
  }
}

/**
 * Consume credits for a user
 */
export async function consumeCredits(userId: string, amount: number) {
  try {
    console.log(`Consuming ${amount} credits for user ${userId}`);
    
    // In real implementation:
    // await convex.mutation(api.test.consumeCredits, { userId, amount });
    
    return true;
  } catch (error) {
    console.error('Failed to consume credits:', error);
    throw error;
  }
}

/**
 * Set subscription status
 */
export async function setSubscriptionStatus(
  userId: string,
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
) {
  try {
    console.log(`Setting subscription status to ${status} for user ${userId}`);
    
    // In real implementation:
    // await convex.mutation(api.test.setSubscriptionStatus, { userId, status });
    
    return true;
  } catch (error) {
    console.error('Failed to set subscription status:', error);
    throw error;
  }
}

/**
 * Set subscription renewal date
 */
export async function setSubscriptionRenewalDate(
  userId: string,
  daysUntilRenewal: number
) {
  try {
    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + daysUntilRenewal);
    
    console.log(`Setting renewal date to ${renewalDate.toISOString()}`);
    
    // In real implementation:
    // await convex.mutation(api.test.setRenewalDate, {
    //   userId,
    //   renewalDate: renewalDate.toISOString()
    // });
    
    return renewalDate;
  } catch (error) {
    console.error('Failed to set renewal date:', error);
    throw error;
  }
}

/**
 * Trigger subscription renewal webhook
 */
export async function triggerSubscriptionRenewal(
  userId: string,
  shouldFail: boolean = false
) {
  try {
    console.log(`Triggering subscription renewal (shouldFail: ${shouldFail})`);
    
    const webhookData = {
      type: shouldFail ? 'invoice.payment_failed' : 'invoice.payment_succeeded',
      data: {
        object: {
          subscription: 'sub_test_pro',
          customer: 'cus_test_pro',
          amount_paid: shouldFail ? 0 : 1900,
          status: shouldFail ? 'open' : 'paid',
        },
      },
    };
    
    // Send webhook to the application
    const response = await fetch('/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(webhookData),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to trigger renewal:', error);
    throw error;
  }
}

/**
 * Clear all test data
 */
export async function clearAllTestData() {
  try {
    console.log('Clearing all test data');
    
    // In real implementation:
    // await convex.mutation(api.test.clearAllTestData);
    
    return true;
  } catch (error) {
    console.error('Failed to clear test data:', error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    // In real implementation:
    // return await convex.query(api.test.getUserByEmail, { email });
    
    // Mock implementation
    const tier = email.includes('free') ? 'free' : 
                 email.includes('pro') ? 'pro' : 'business';
    return testUserConfigs[tier];
  } catch (error) {
    console.error('Failed to get user:', error);
    throw error;
  }
}

/**
 * Update user credits
 */
export async function updateUserCredits(userId: string, credits: number) {
  try {
    console.log(`Updating user ${userId} credits to ${credits}`);
    
    // In real implementation:
    // await convex.mutation(api.test.updateUserCredits, { userId, credits });
    
    return true;
  } catch (error) {
    console.error('Failed to update credits:', error);
    throw error;
  }
}

/**
 * Create a pending invoice
 */
export async function createPendingInvoice(userId: string, amount: number) {
  try {
    console.log(`Creating pending invoice for ${amount}`);
    
    // In real implementation:
    // await convex.mutation(api.test.createPendingInvoice, {
    //   userId,
    //   amount,
    //   status: 'open'
    // });
    
    return {
      id: 'inv_test_pending',
      amount,
      status: 'open',
    };
  } catch (error) {
    console.error('Failed to create pending invoice:', error);
    throw error;
  }
}

/**
 * Set previous subscription for downgrade testing
 */
export async function setPreviousSubscription(
  userId: string,
  previousPlan: 'pro' | 'business'
) {
  try {
    console.log(`Setting previous subscription: ${previousPlan}`);
    
    // In real implementation:
    // await convex.mutation(api.test.setPreviousSubscription, {
    //   userId,
    //   previousPlan
    // });
    
    return true;
  } catch (error) {
    console.error('Failed to set previous subscription:', error);
    throw error;
  }
}

/**
 * Expire grace period for a user
 */
export async function expireGracePeriod(userId: string) {
  try {
    console.log(`Expiring grace period for user ${userId}`);
    
    // In real implementation:
    // await convex.mutation(api.test.expireGracePeriod, { userId });
    
    return true;
  } catch (error) {
    console.error('Failed to expire grace period:', error);
    throw error;
  }
}

/**
 * Set grace period for a user
 */
export async function setGracePeriod(userId: string, daysRemaining: number) {
  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysRemaining);
    
    console.log(`Setting grace period to expire on ${expiryDate.toISOString()}`);
    
    // In real implementation:
    // await convex.mutation(api.test.setGracePeriod, {
    //   userId,
    //   expiryDate: expiryDate.toISOString()
    // });
    
    return expiryDate;
  } catch (error) {
    console.error('Failed to set grace period:', error);
    throw error;
  }
}

/**
 * Trigger billing reminders
 */
export async function triggerBillingReminders() {
  try {
    console.log('Triggering billing reminder emails');
    
    // In real implementation:
    // await convex.action(api.test.sendBillingReminders);
    
    return true;
  } catch (error) {
    console.error('Failed to trigger billing reminders:', error);
    throw error;
  }
}

/**
 * Get last email sent
 */
export async function getLastEmail() {
  try {
    // Mock implementation
    return {
      to: 'pro.user@test.precisionpdf.com',
      subject: 'Subscription renewal reminder',
      html: 'Your subscription will renew in 3 days for $19',
    };
  } catch (error) {
    console.error('Failed to get last email:', error);
    throw error;
  }
}

/**
 * Set card expiration status
 */
export async function setCardExpiration(userId: string, isExpiring: boolean) {
  try {
    console.log(`Setting card expiration status: ${isExpiring}`);
    
    // In real implementation:
    // await convex.mutation(api.test.setCardExpiration, {
    //   userId,
    //   isExpiring
    // });
    
    return true;
  } catch (error) {
    console.error('Failed to set card expiration:', error);
    throw error;
  }
}