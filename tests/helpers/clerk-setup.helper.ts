/**
 * Clerk setup helper for E2E tests
 * Handles testing token generation and environment setup
 */

import { createClerkClient } from '@clerk/backend';

/**
 * Generate a Clerk testing token
 * Note: This requires CLERK_SECRET_KEY to be set
 */
export async function generateClerkTestingToken(): Promise<string> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error(
      'CLERK_SECRET_KEY is required. Get it from Clerk Dashboard > API Keys'
    );
  }
  
  if (!secretKey.includes('_test_')) {
    throw new Error(
      'CLERK_SECRET_KEY must be from a development instance (should contain "_test_")'
    );
  }
  
  try {
    // Initialize Clerk client
    const clerk = createClerkClient({ secretKey });
    
    // Create testing token
    const testingToken = await clerk.testingTokens.createTestingToken();
    
    return testingToken.token;
  } catch (error) {
    console.error('Failed to generate testing token:', error);
    throw error;
  }
}

/**
 * Setup Clerk for testing
 * This can be used if clerkSetup() from @clerk/testing doesn't work
 */
export async function setupClerkForTesting() {
  // Check if token already exists
  if (process.env.CLERK_TESTING_TOKEN) {
    console.log('✓ Using existing CLERK_TESTING_TOKEN');
    return;
  }
  
  // Generate new token
  console.log('Generating new Clerk testing token...');
  const token = await generateClerkTestingToken();
  
  // Set it in environment
  process.env.CLERK_TESTING_TOKEN = token;
  
  console.log('✓ Clerk testing token generated and set');
  console.log('\nIMPORTANT: Add this to your .env.local file:');
  console.log(`CLERK_TESTING_TOKEN=${token}`);
}

/**
 * Get required Clerk environment variables info
 */
export function getClerkEnvInfo() {
  const required = {
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY,
    'CLERK_TESTING_TOKEN': process.env.CLERK_TESTING_TOKEN,
  };
  
  console.log('\nClerk Environment Status:');
  console.log('========================');
  
  for (const [key, value] of Object.entries(required)) {
    const status = value ? '✅' : '❌';
    const display = value ? (key.includes('SECRET') ? '***' : value.substring(0, 20) + '...') : 'Not set';
    console.log(`${status} ${key}: ${display}`);
  }
  
  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    console.log('\n⚠️  Missing environment variables:');
    missing.forEach(key => {
      console.log(`   - ${key}`);
    });
    console.log('\nGet these from your Clerk Dashboard:');
    console.log('1. Go to https://dashboard.clerk.com');
    console.log('2. Select your application');
    console.log('3. Navigate to API Keys');
    console.log('4. Copy the required keys');
  }
  
  return missing.length === 0;
}