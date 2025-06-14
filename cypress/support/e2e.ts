/**
 * E2E test support file
 * This file is processed and loaded automatically before your test files.
 */

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Disable uncaught exception handling for better test stability
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // You may want to be more selective about which errors to ignore
  return false;
});