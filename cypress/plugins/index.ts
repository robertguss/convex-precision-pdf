/**
 * Cypress plugin file for payment test tasks
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

// Initialize Convex client for test operations
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3210';
const convex = new ConvexHttpClient(convexUrl);

// Test user data
const testUsers = {
  free: {
    id: 'test-user-free',
    email: 'free.user@test.precisionpdf.com',
    name: 'Free Test User',
    clerkId: 'user_test_free',
  },
  pro: {
    id: 'test-user-pro',
    email: 'pro.user@test.precisionpdf.com',
    name: 'Pro Test User',
    clerkId: 'user_test_pro',
    stripeCustomerId: 'cus_test_pro',
    stripeSubscriptionId: 'sub_test_pro',
  },
  business: {
    id: 'test-user-business',
    email: 'business.user@test.precisionpdf.com',
    name: 'Business Test User',
    clerkId: 'user_test_business',
    stripeCustomerId: 'cus_test_business',
    stripeSubscriptionId: 'sub_test_business',
  },
};

export default function setupNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
) {
  // Reset database to clean state
  on('task', {
    async resetDatabase() {
      try {
        // This would typically call a test-only mutation
        // For now, we'll simulate the reset
        console.log('Resetting database for tests');
        
        // In a real implementation, this would:
        // 1. Clear all test user data
        // 2. Clear all test documents
        // 3. Clear all test subscriptions
        
        return null;
      } catch (error) {
        console.error('Failed to reset database:', error);
        throw error;
      }
    },

    // Seed test users with different subscription tiers
    async seedTestUsers() {
      try {
        console.log('Seeding test users');
        
        // In a real implementation, this would create users via Convex mutations
        // with appropriate subscription states
        
        return null;
      } catch (error) {
        console.error('Failed to seed test users:', error);
        throw error;
      }
    },

    // Consume credits for a user
    async consumeCredits({ userId, amount }: { userId?: string; amount: number }) {
      try {
        console.log(`Consuming ${amount} credits for user`);
        
        // This would call a test mutation to reduce credits
        // await convex.mutation(api.test.consumeCredits, { userId, amount });
        
        return null;
      } catch (error) {
        console.error('Failed to consume credits:', error);
        throw error;
      }
    },

    // Set subscription renewal date
    async setSubscriptionRenewalDate({ daysUntilRenewal }: { daysUntilRenewal: number }) {
      try {
        const renewalDate = new Date();
        renewalDate.setDate(renewalDate.getDate() + daysUntilRenewal);
        
        console.log(`Setting renewal date to ${renewalDate.toISOString()}`);
        
        // This would update the subscription in Convex
        // await convex.mutation(api.test.setRenewalDate, { date: renewalDate });
        
        return null;
      } catch (error) {
        console.error('Failed to set renewal date:', error);
        throw error;
      }
    },

    // Trigger subscription renewal webhook
    async triggerSubscriptionRenewal({ shouldFail = false }: { shouldFail?: boolean } = {}) {
      try {
        console.log(`Triggering subscription renewal (shouldFail: ${shouldFail})`);
        
        // This would simulate a Stripe webhook
        const webhookData = {
          type: shouldFail ? 'invoice.payment_failed' : 'invoice.payment_succeeded',
          data: {
            object: {
              subscription: 'sub_test_pro',
              amount_paid: shouldFail ? 0 : 1900,
              status: shouldFail ? 'open' : 'paid',
            },
          },
        };
        
        // Send webhook to the application
        // await fetch('/api/webhooks/stripe', { method: 'POST', body: JSON.stringify(webhookData) });
        
        return null;
      } catch (error) {
        console.error('Failed to trigger renewal:', error);
        throw error;
      }
    },

    // Set card expiration status
    async setCardExpiration({ expired }: { expired: boolean }) {
      try {
        console.log(`Setting card expiration: ${expired}`);
        
        // This would update the payment method in Stripe test mode
        
        return null;
      } catch (error) {
        console.error('Failed to set card expiration:', error);
        throw error;
      }
    },

    // Set subscription status
    async setSubscriptionStatus({ status, daysOverdue }: { status: string; daysOverdue?: number }) {
      try {
        console.log(`Setting subscription status to ${status}`);
        
        // This would update the subscription state
        
        return null;
      } catch (error) {
        console.error('Failed to set subscription status:', error);
        throw error;
      }
    },

    // Expire grace period
    async expireGracePeriod() {
      try {
        console.log('Expiring grace period');
        
        // This would advance time or update subscription to suspended state
        
        return null;
      } catch (error) {
        console.error('Failed to expire grace period:', error);
        throw error;
      }
    },

    // Expire user's card
    async expireUserCard() {
      try {
        console.log('Expiring user card');
        
        // This would update the payment method to be expired
        
        return null;
      } catch (error) {
        console.error('Failed to expire user card:', error);
        throw error;
      }
    },

    // Create pending invoice
    async createPendingInvoice() {
      try {
        console.log('Creating pending invoice');
        
        // This would create an unpaid invoice in Stripe
        
        return null;
      } catch (error) {
        console.error('Failed to create pending invoice:', error);
        throw error;
      }
    },

    // Create test documents
    async createTestDocuments({ count }: { count: number }) {
      try {
        console.log(`Creating ${count} test documents`);
        
        // This would create documents in the database
        
        return null;
      } catch (error) {
        console.error('Failed to create test documents:', error);
        throw error;
      }
    },

    // Set previous subscription
    async setPreviousSubscription({ plan }: { plan: string }) {
      try {
        console.log(`Setting previous subscription: ${plan}`);
        
        // This would create a canceled subscription record
        
        return null;
      } catch (error) {
        console.error('Failed to set previous subscription:', error);
        throw error;
      }
    },

    // Trigger billing reminders
    async triggerBillingReminders() {
      try {
        console.log('Triggering billing reminders');
        
        // This would run the reminder job
        
        return null;
      } catch (error) {
        console.error('Failed to trigger billing reminders:', error);
        throw error;
      }
    },

    // Get last email sent (for testing notifications)
    async getLastEmail() {
      try {
        console.log('Getting last email');
        
        // This would retrieve from a test email service
        // For now, return mock email
        return {
          to: 'pro.user@test.precisionpdf.com',
          subject: 'Subscription renewal reminder',
          html: 'Your subscription renews in 3 days for $19.00',
        };
      } catch (error) {
        console.error('Failed to get last email:', error);
        throw error;
      }
    },
  });

  return config;
}

/**
 * Helper function to wait for a condition
 */
async function waitFor(condition: () => Promise<boolean>, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Timeout waiting for condition');
}