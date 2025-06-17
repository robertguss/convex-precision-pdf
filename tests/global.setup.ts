/**
 * Global setup for Playwright tests with Clerk authentication
 */

import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

// Configure to run setup serially
setup.describe.configure({ mode: 'serial' });

setup('global setup', async ({}) => {
  // Initialize Clerk testing
  await clerkSetup();
  
  console.log('✓ Clerk testing environment initialized');
});