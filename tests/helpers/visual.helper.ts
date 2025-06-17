/**
 * Visual testing helper functions for Playwright
 * Handles screenshot comparisons, visual regression testing, and accessibility
 */

import { Page, Locator, expect } from '@playwright/test';
import path from 'path';

export interface VisualTestOptions {
  fullPage?: boolean;
  mask?: Locator[];
  animations?: 'disabled' | 'allow';
  maxDiffPixels?: number;
  threshold?: number;
  stylePath?: string;
}

/**
 * Take a screenshot with consistent settings for visual testing
 */
export async function takeVisualSnapshot(
  page: Page,
  name: string,
  options: VisualTestOptions = {}
) {
  // Disable animations by default for consistency
  if (options.animations === 'disabled' || options.animations === undefined) {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });
  }
  
  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
  
  // Wait for images to load
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await expect(page).toHaveScreenshot(name, {
    fullPage: options.fullPage ?? false,
    mask: options.mask,
    maxDiffPixels: options.maxDiffPixels ?? 100,
    threshold: options.threshold ?? 0.2,
  });
}

/**
 * Compare specific component visually
 */
export async function compareComponent(
  locator: Locator,
  name: string,
  options: Omit<VisualTestOptions, 'fullPage'> = {}
) {
  // Wait for component to be stable
  await locator.waitFor({ state: 'visible' });
  await locator.evaluate((el) => {
    // Force layout calculation
    el.getBoundingClientRect();
  });
  
  await expect(locator).toHaveScreenshot(name, {
    mask: options.mask,
    maxDiffPixels: options.maxDiffPixels ?? 50,
    threshold: options.threshold ?? 0.2,
  });
}

/**
 * Visual testing for different viewport sizes
 */
export async function testResponsiveDesign(
  page: Page,
  name: string,
  viewports: { width: number; height: number; label: string }[]
) {
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(500); // Allow layout to settle
    await takeVisualSnapshot(page, `${name}-${viewport.label}`, { fullPage: true });
  }
}

/**
 * Test dark mode visual appearance
 */
export async function testDarkMode(page: Page, name: string) {
  // Enable dark mode
  await page.emulateMedia({ colorScheme: 'dark' });
  await takeVisualSnapshot(page, `${name}-dark`, { fullPage: true });
  
  // Test light mode for comparison
  await page.emulateMedia({ colorScheme: 'light' });
  await takeVisualSnapshot(page, `${name}-light`, { fullPage: true });
}

/**
 * Accessibility snapshot testing
 */
export async function testAccessibility(page: Page) {
  const snapshot = await page.accessibility.snapshot();
  return snapshot;
}

/**
 * Check color contrast for accessibility
 */
export async function checkColorContrast(page: Page, selector: string) {
  const results = await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    
    const style = window.getComputedStyle(element);
    const backgroundColor = style.backgroundColor;
    const color = style.color;
    
    // Simple contrast ratio calculation (would need a proper library for accurate results)
    const getLuminance = (rgb: string) => {
      const values = rgb.match(/\d+/g)?.map(Number) || [];
      if (values.length < 3) return 0;
      
      const [r, g, b] = values.map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    
    const bgLuminance = getLuminance(backgroundColor);
    const fgLuminance = getLuminance(color);
    
    const contrast = (Math.max(bgLuminance, fgLuminance) + 0.05) / 
                     (Math.min(bgLuminance, fgLuminance) + 0.05);
    
    return {
      backgroundColor,
      color,
      contrast,
      meetsWCAG_AA: contrast >= 4.5,
      meetsWCAG_AAA: contrast >= 7,
    };
  }, selector);
  
  return results;
}

/**
 * Create visual regression test report
 */
export async function generateVisualReport(
  results: { name: string; passed: boolean; diff?: string }[]
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Visual Regression Test Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
        .passed { background: #e7f5e7; }
        .failed { background: #ffe7e7; }
        .diff-image { max-width: 100%; margin-top: 10px; }
        h1 { color: #333; }
        .stats { margin: 20px 0; font-size: 18px; }
      </style>
    </head>
    <body>
      <h1>Visual Regression Test Report</h1>
      <div class="stats">
        Total: ${results.length} | 
        Passed: ${results.filter(r => r.passed).length} | 
        Failed: ${results.filter(r => !r.passed).length}
      </div>
      ${results.map(result => `
        <div class="test ${result.passed ? 'passed' : 'failed'}">
          <h3>${result.name}</h3>
          <p>Status: ${result.passed ? '✅ Passed' : '❌ Failed'}</p>
          ${result.diff ? `<img class="diff-image" src="${result.diff}" alt="Diff">` : ''}
        </div>
      `).join('')}
    </body>
    </html>
  `;
  
  const fs = require('fs');
  fs.writeFileSync('visual-report.html', html);
}

/**
 * Mask dynamic content for visual testing
 */
export async function maskDynamicContent(page: Page) {
  // Mask timestamps
  await page.addStyleTag({
    content: `
      [data-testid*="timestamp"],
      [data-testid*="date"],
      .timestamp,
      .date-display {
        visibility: hidden !important;
      }
    `,
  });
  
  // Replace dynamic text content
  await page.evaluate(() => {
    // Replace dates with static text
    document.querySelectorAll('[data-testid*="date"]').forEach(el => {
      if (el.textContent) {
        el.textContent = 'January 1, 2024';
      }
    });
    
    // Replace times with static text
    document.querySelectorAll('[data-testid*="time"]').forEach(el => {
      if (el.textContent) {
        el.textContent = '12:00 PM';
      }
    });
  });
}

/**
 * Visual testing for loading states
 */
export async function captureLoadingStates(page: Page, triggerAction: () => Promise<void>) {
  const screenshots: Buffer[] = [];
  
  // Start capturing
  const captureInterval = setInterval(async () => {
    const screenshot = await page.screenshot();
    screenshots.push(screenshot);
  }, 100); // Capture every 100ms
  
  // Perform the action
  await triggerAction();
  
  // Stop capturing
  clearInterval(captureInterval);
  
  return screenshots;
}

/**
 * Test hover and focus states visually
 */
export async function testInteractionStates(
  page: Page,
  selector: string,
  name: string
) {
  const element = page.locator(selector);
  
  // Normal state
  await compareComponent(element, `${name}-normal`);
  
  // Hover state
  await element.hover();
  await page.waitForTimeout(300); // Wait for transition
  await compareComponent(element, `${name}-hover`);
  
  // Focus state (if applicable)
  const tagName = await element.evaluate(el => el.tagName.toLowerCase());
  if (['input', 'button', 'a', 'textarea', 'select'].includes(tagName)) {
    await element.focus();
    await page.waitForTimeout(300); // Wait for transition
    await compareComponent(element, `${name}-focus`);
  }
  
  // Active/pressed state (if applicable)
  if (['button', 'a'].includes(tagName)) {
    await element.hover();
    await page.mouse.down();
    await page.waitForTimeout(100);
    await compareComponent(element, `${name}-active`);
    await page.mouse.up();
  }
}