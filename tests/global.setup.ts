/**
 * Global setup for Playwright tests with Clerk authentication
 */

import { clerkSetup } from '@clerk/testing/playwright';

export default async function globalSetup() {
  // Initialize Clerk testing
  await clerkSetup();
  
  console.log('✓ Clerk testing environment initialized');
}