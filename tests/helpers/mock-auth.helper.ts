/**
 * Mock authentication helper for testing
 * Uses direct navigation and session manipulation instead of real Clerk auth
 */

import { Page } from '@playwright/test';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'pro' | 'business';
  credits: number;
}

export const mockUsers: Record<string, MockUser> = {
  free: {
    id: 'mock-user-free',
    email: 'free@test.com',
    name: 'Free User',
    tier: 'free',
    credits: 3,
  },
  pro: {
    id: 'mock-user-pro',
    email: 'pro@test.com',
    name: 'Pro User',
    tier: 'pro',
    credits: 50,
  },
  business: {
    id: 'mock-user-business',
    email: 'business@test.com',
    name: 'Business User',
    tier: 'business',
    credits: 500,
  },
};

/**
 * Mock sign in by directly navigating to dashboard
 * This bypasses Clerk authentication for testing
 */
export async function mockSignIn(page: Page, tier: 'free' | 'pro' | 'business') {
  const user = mockUsers[tier];
  
  // Set mock user data in session storage
  await page.addInitScript((userData) => {
    window.localStorage.setItem('mock_user', JSON.stringify(userData));
    window.localStorage.setItem('mock_auth', 'true');
  }, user);
  
  // Navigate directly to dashboard
  await page.goto('/dashboard');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
}

/**
 * Mock sign out
 */
export async function mockSignOut(page: Page) {
  // Clear mock auth
  await page.evaluate(() => {
    window.localStorage.removeItem('mock_user');
    window.localStorage.removeItem('mock_auth');
  });
  
  // Navigate to home
  await page.goto('/');
}

/**
 * Get current mock user
 */
export async function getMockUser(page: Page): Promise<MockUser | null> {
  return await page.evaluate(() => {
    const userData = window.localStorage.getItem('mock_user');
    return userData ? JSON.parse(userData) : null;
  });
}

/**
 * Check if mock authenticated
 */
export async function isMockAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return window.localStorage.getItem('mock_auth') === 'true';
  });
}