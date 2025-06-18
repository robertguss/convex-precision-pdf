#!/usr/bin/env tsx

/**
 * Setup script for E2E tests
 * Checks environment and helps configure Clerk testing
 */

import { getClerkEnvInfo, setupClerkForTesting } from '../tests/helpers/clerk-setup.helper';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🎭 Playwright E2E Test Setup');
  console.log('============================\n');
  
  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found');
    console.log('   Create one with your Clerk keys:');
    console.log('\n   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...');
    console.log('   CLERK_SECRET_KEY=sk_test_...\n');
    process.exit(1);
  }
  
  // Load environment variables
  require('dotenv').config({ path: envPath });
  
  // Check Clerk environment
  const hasAllKeys = getClerkEnvInfo();
  
  // Check if we have the minimum required keys
  const hasPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasSecretKey = process.env.CLERK_SECRET_KEY;
  
  if (!hasPublishableKey || !hasSecretKey) {
    console.log('\n📋 Setup Instructions:');
    console.log('====================');
    console.log('1. Go to https://dashboard.clerk.com');
    console.log('2. Select your application');
    console.log('3. Click on "API Keys" in the sidebar');
    console.log('4. Copy the following keys to your .env.local:');
    console.log('   - Publishable key → NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
    console.log('   - Secret key → CLERK_SECRET_KEY');
    console.log('\n5. Make sure you are using a DEVELOPMENT instance');
    console.log('   (Secret key should contain "_test_")');
    process.exit(1);
  }
  
  // Try to generate testing token
  try {
    await setupClerkForTesting();
    
    console.log('\n✅ E2E Test Setup Complete!');
    console.log('\nYou can now run tests with:');
    console.log('   pnpm run pw:test:ui');
    
  } catch (error) {
    console.error('\n❌ Failed to setup testing token:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Ensure your Clerk instance is in development mode');
    console.log('2. Check that your secret key contains "_test_"');
    console.log('3. Verify your internet connection');
    console.log('\nAlternatively, the testing token will be generated automatically');
    console.log('when you run the tests if clerkSetup() is properly configured.');
  }
}

main().catch(console.error);