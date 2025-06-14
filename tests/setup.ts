import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, afterAll, beforeAll, vi } from 'vitest'
import { server } from './mocks/server'

/**
 * MSW server setup for mocking external APIs
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

/**
 * Mock window.matchMedia
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

/**
 * Mock IntersectionObserver
 */
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

/**
 * Mock ResizeObserver
 */
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

/**
 * Mock window.URL.createObjectURL
 */
window.URL.createObjectURL = vi.fn(() => 'mocked-url')

/**
 * Mock window.URL.revokeObjectURL
 */
window.URL.revokeObjectURL = vi.fn()

/**
 * Mock scrollIntoView
 */
window.HTMLElement.prototype.scrollIntoView = vi.fn()

/**
 * Mock console methods in test environment
 */
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
}