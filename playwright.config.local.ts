import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Configuration for running tests when dev server is already running
 */
export default defineConfig({
  ...baseConfig,
  // Remove webServer configuration since we're running locally
  webServer: undefined,
});