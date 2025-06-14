/**
 * Component test support file
 * This file is processed and loaded automatically before your component test files.
 */

// Import commands.js using ES2015 syntax:
import './commands';

// Import global styles if needed
// import '../../src/app/globals.css';

// Import mount function
import { mount } from 'cypress/react18';

// Augment the Cypress namespace to include type definitions for
// your custom command.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

// Add the mount command
Cypress.Commands.add('mount', mount);