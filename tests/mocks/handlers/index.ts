import { clerkHandlers } from './clerk'
import { stripeHandlers } from './stripe'
import { landingAIHandlers } from './landing-ai'

/**
 * All MSW request handlers for external API mocking
 * Used in unit and integration tests only
 */
export const handlers = [
  ...clerkHandlers,
  ...stripeHandlers,
  ...landingAIHandlers
]

// Re-export individual handler groups for selective use
export { clerkHandlers } from './clerk'
export { stripeHandlers } from './stripe'
export { landingAIHandlers } from './landing-ai'