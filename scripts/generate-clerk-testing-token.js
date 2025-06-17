#!/usr/bin/env node

/**
 * Generate a Clerk testing token for E2E tests
 * 
 * Usage: node scripts/generate-clerk-testing-token.js
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY environment variable is required');
  console.error('   Set it from your Clerk Dashboard > API Keys');
  process.exit(1);
}

async function generateTestingToken() {
  try {
    const response = await fetch('https://api.clerk.com/v1/testing_tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to generate token: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    console.log('✅ Testing token generated successfully!');
    console.log('\nAdd this to your .env.local file:');
    console.log(`CLERK_TESTING_TOKEN=${data.token}`);
    console.log('\nNote: This token is short-lived (60 seconds) and for development only.');
    
    return data.token;
  } catch (error) {
    console.error('❌ Error generating testing token:', error.message);
    process.exit(1);
  }
}

generateTestingToken();