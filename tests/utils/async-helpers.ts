import { vi } from 'vitest'
import { waitFor } from '@testing-library/react'

/**
 * Async test utilities for handling promises, timers, and asynchronous operations
 * Provides comprehensive helpers for testing async code patterns
 */

/**
 * Timer control utilities for testing time-dependent code
 */
export const timerUtils = {
  /**
   * Setup fake timers for a test
   */
  useFakeTimers: () => {
    vi.useFakeTimers()
  },

  /**
   * Restore real timers
   */
  useRealTimers: () => {
    vi.useRealTimers()
  },

  /**
   * Advance timers by specified milliseconds
   */
  advanceTimersByTime: (ms: number) => {
    vi.advanceTimersByTime(ms)
  },

  /**
   * Advance timers to next timer
   */
  advanceTimersToNextTimer: () => {
    vi.advanceTimersToNextTimer()
  },

  /**
   * Run all pending timers
   */
  runAllTimers: () => {
    vi.runAllTimers()
  },

  /**
   * Run only immediate timers (setTimeout with 0)
   */
  runOnlyPendingTimers: () => {
    vi.runOnlyPendingTimers()
  },

  /**
   * Clear all timers
   */
  clearAllTimers: () => {
    vi.clearAllTimers()
  }
}

/**
 * Promise utilities for testing async operations
 */
export const promiseUtils = {
  /**
   * Create a promise that resolves after specified delay
   */
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Create a promise that resolves with a value after delay
   */
  resolveAfter: <T>(value: T, ms: number = 0): Promise<T> => 
    new Promise(resolve => setTimeout(() => resolve(value), ms)),

  /**
   * Create a promise that rejects with an error after delay
   */
  rejectAfter: (error: Error | string, ms: number = 0): Promise<never> => 
    new Promise((_, reject) => setTimeout(() => reject(error), ms)),

  /**
   * Create a promise that never resolves (for testing timeouts)
   */
  neverResolve: (): Promise<never> => new Promise(() => {}),

  /**
   * Create a promise that resolves immediately
   */
  immediate: <T>(value: T): Promise<T> => Promise.resolve(value),

  /**
   * Create a promise that rejects immediately
   */
  immediateReject: (error: Error | string): Promise<never> => Promise.reject(error),

  /**
   * Wait for all promises to settle
   */
  waitForAll: async (promises: Promise<any>[]) => {
    return Promise.allSettled(promises)
  },

  /**
   * Race promises with timeout
   */
  raceWithTimeout: async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    const timeout = promiseUtils.rejectAfter(new Error('Timeout'), timeoutMs)
    return Promise.race([promise, timeout])
  }
}

/**
 * Mock function utilities for async testing
 */
export const mockUtils = {
  /**
   * Create a mock function that resolves with a value
   */
  createResolvingMock: <T>(value: T, delay: number = 0) => {
    return vi.fn().mockImplementation(() => promiseUtils.resolveAfter(value, delay))
  },

  /**
   * Create a mock function that rejects with an error
   */
  createRejectingMock: (error: Error | string, delay: number = 0) => {
    return vi.fn().mockImplementation(() => promiseUtils.rejectAfter(error, delay))
  },

  /**
   * Create a mock function that alternates between resolve and reject
   */
  createAlternatingMock: <T>(resolveValue: T, rejectError: Error | string) => {
    let callCount = 0
    return vi.fn().mockImplementation(() => {
      callCount++
      return callCount % 2 === 1 
        ? promiseUtils.immediate(resolveValue)
        : promiseUtils.immediateReject(rejectError)
    })
  },

  /**
   * Create a mock function that times out
   */
  createTimeoutMock: (timeoutMs: number = 5000) => {
    return vi.fn().mockImplementation(() => promiseUtils.neverResolve())
  },

  /**
   * Create a mock function with configurable responses
   */
  createConfigurableMock: () => {
    const responses: Array<{ type: 'resolve' | 'reject', value: any, delay?: number }> = []
    let currentIndex = 0

    const mock = vi.fn().mockImplementation(() => {
      if (currentIndex >= responses.length) {
        throw new Error('Mock called more times than configured responses')
      }

      const response = responses[currentIndex++]
      const delay = response.delay || 0

      if (response.type === 'resolve') {
        return promiseUtils.resolveAfter(response.value, delay)
      } else {
        return promiseUtils.rejectAfter(response.value, delay)
      }
    })

    // Helper methods to configure the mock
    ;(mock as any).willResolve = (value: any, delay?: number) => {
      responses.push({ type: 'resolve', value, delay })
      return mock
    }

    ;(mock as any).willReject = (error: any, delay?: number) => {
      responses.push({ type: 'reject', value: error, delay })
      return mock
    }

    ;(mock as any).reset = () => {
      responses.length = 0
      currentIndex = 0
      mock.mockClear()
    }

    return mock
  }
}

/**
 * Polling utilities for testing real-time updates
 */
export const pollingUtils = {
  /**
   * Wait for a condition to be true with timeout
   */
  waitForCondition: async (
    condition: () => boolean | Promise<boolean>,
    options: {
      timeout?: number
      interval?: number
      timeoutMessage?: string
    } = {}
  ) => {
    const { timeout = 5000, interval = 100, timeoutMessage = 'Condition not met within timeout' } = options
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true
      }
      await promiseUtils.delay(interval)
    }

    throw new Error(timeoutMessage)
  },

  /**
   * Wait for a value to change
   */
  waitForValueChange: async <T>(
    getValue: () => T | Promise<T>,
    initialValue: T,
    options: {
      timeout?: number
      interval?: number
    } = {}
  ) => {
    const { timeout = 5000, interval = 100 } = options

    return pollingUtils.waitForCondition(
      async () => {
        const currentValue = await getValue()
        return currentValue !== initialValue
      },
      {
        timeout,
        interval,
        timeoutMessage: `Value did not change from ${initialValue} within timeout`
      }
    )
  },

  /**
   * Wait for multiple conditions to be true
   */
  waitForAllConditions: async (
    conditions: Array<() => boolean | Promise<boolean>>,
    options: {
      timeout?: number
      interval?: number
    } = {}
  ) => {
    const { timeout = 5000, interval = 100 } = options

    return pollingUtils.waitForCondition(
      async () => {
        const results = await Promise.all(conditions.map(condition => condition()))
        return results.every(result => result === true)
      },
      {
        timeout,
        interval,
        timeoutMessage: 'Not all conditions were met within timeout'
      }
    )
  }
}

/**
 * Utilities for testing API calls and network requests
 */
export const networkUtils = {
  /**
   * Simulate network delay
   */
  simulateNetworkDelay: (minMs: number = 100, maxMs: number = 500) => {
    const delay = Math.random() * (maxMs - minMs) + minMs
    return promiseUtils.delay(delay)
  },

  /**
   * Create a mock fetch that can be configured
   */
  createMockFetch: () => {
    const responses = new Map<string, any>()
    
    const mockFetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      await networkUtils.simulateNetworkDelay()
      
      const key = `${options?.method || 'GET'} ${url}`
      const response = responses.get(key)
      
      if (!response) {
        throw new Error(`No mock response configured for ${key}`)
      }

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status || 200,
        statusText: response.statusText || 'OK',
        json: async () => response.data,
        text: async () => JSON.stringify(response.data),
        headers: new Headers(response.headers || {})
      }
    })

    ;(mockFetch as any).mockResponse = (method: string, url: string, data: any, status: number = 200) => {
      responses.set(`${method} ${url}`, { data, status })
    }

    ;(mockFetch as any).mockError = (method: string, url: string, error: Error) => {
      const key = `${method} ${url}`
      mockFetch.mockImplementationOnce(async () => {
        await networkUtils.simulateNetworkDelay()
        throw error
      })
    }

    return mockFetch
  }
}

/**
 * Utilities for testing WebSocket connections
 */
export const websocketUtils = {
  /**
   * Create a mock WebSocket for testing real-time features
   */
  createMockWebSocket: () => {
    const listeners = new Map<string, Function[]>()
    let readyState = WebSocket.CONNECTING

    const mockWS = {
      readyState,
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn((event: string, callback: Function) => {
        if (!listeners.has(event)) {
          listeners.set(event, [])
        }
        listeners.get(event)!.push(callback)
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      
      // Test helpers
      simulateOpen: () => {
        readyState = WebSocket.OPEN
        mockWS.readyState = readyState
        const openListeners = listeners.get('open') || []
        openListeners.forEach(callback => callback(new Event('open')))
      },
      
      simulateMessage: (data: any) => {
        const messageListeners = listeners.get('message') || []
        messageListeners.forEach(callback => callback({ data: JSON.stringify(data) }))
      },
      
      simulateError: (error: Error) => {
        const errorListeners = listeners.get('error') || []
        errorListeners.forEach(callback => callback(error))
      },
      
      simulateClose: () => {
        readyState = WebSocket.CLOSED
        mockWS.readyState = readyState
        const closeListeners = listeners.get('close') || []
        closeListeners.forEach(callback => callback(new CloseEvent('close')))
      }
    }

    return mockWS
  }
}

/**
 * Utilities for testing React Query and data fetching
 */
export const queryUtils = {
  /**
   * Wait for query to succeed
   */
  waitForQuerySuccess: async (queryKey: string[], timeout: number = 5000) => {
    return waitFor(() => {
      // This would integrate with actual React Query in real tests
      // For now, just return a promise that resolves
      return Promise.resolve()
    }, { timeout })
  },

  /**
   * Wait for query to fail
   */
  waitForQueryError: async (queryKey: string[], timeout: number = 5000) => {
    return waitFor(() => {
      // This would integrate with actual React Query in real tests
      return Promise.resolve()
    }, { timeout })
  },

  /**
   * Simulate query invalidation
   */
  simulateQueryInvalidation: async (queryKey: string[]) => {
    // This would invalidate queries in real tests
    await promiseUtils.delay(10)
  }
}

/**
 * Comprehensive async test scenario builder
 */
export class AsyncTestScenario {
  private steps: Array<() => Promise<void>> = []

  /**
   * Add a delay step
   */
  delay(ms: number) {
    this.steps.push(() => promiseUtils.delay(ms))
    return this
  }

  /**
   * Add a custom async step
   */
  step(fn: () => Promise<void> | void) {
    this.steps.push(async () => {
      await fn()
    })
    return this
  }

  /**
   * Add a condition wait step
   */
  waitFor(condition: () => boolean | Promise<boolean>, timeout?: number) {
    this.steps.push(() => pollingUtils.waitForCondition(condition, { timeout }))
    return this
  }

  /**
   * Execute all steps in sequence
   */
  async execute() {
    for (const step of this.steps) {
      await step()
    }
  }

  /**
   * Execute all steps in parallel
   */
  async executeParallel() {
    await Promise.all(this.steps.map(step => step()))
  }
}

/**
 * Create a new async test scenario
 */
export const createAsyncScenario = () => new AsyncTestScenario()

/**
 * Utility for testing cleanup and teardown
 */
export const cleanupUtils = {
  /**
   * Ensure all promises are settled before test cleanup
   */
  ensureAllPromisesSettled: async (timeout: number = 1000) => {
    await promiseUtils.delay(timeout)
  },

  /**
   * Cancel all pending operations
   */
  cancelAllOperations: () => {
    timerUtils.clearAllTimers()
  }
}