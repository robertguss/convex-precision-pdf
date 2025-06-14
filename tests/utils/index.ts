/**
 * Test utilities index - centralizes all test helper exports
 * Import from this file to access all testing utilities
 */

// Core render utilities
export * from './render-helpers'

// Authentication mocking utilities  
export * from './auth-mocking'

// Async testing utilities
export * from './async-helpers'

// Form and file upload utilities
export * from './form-helpers'

// MSW utilities (re-export from existing file)
export * from './msw-helpers'

// Convex testing utilities
export * from './convex'

/**
 * Convenience exports for the most commonly used utilities
 */
export {
  // Render helpers
  renderWithProviders,
  renderForAuthenticatedUser,
  renderForUnauthenticatedUser,
  testUtils
} from './render-helpers'

export {
  // Auth mocking
  mockAuthStates,
  setupAuthMocks,
  authTestUtils,
  DEFAULT_MOCK_USER
} from './auth-mocking'

export {
  // Async utilities
  timerUtils,
  promiseUtils,
  mockUtils,
  pollingUtils,
  createAsyncScenario
} from './async-helpers'

export {
  // Form utilities
  userInteractionUtils,
  formUtils,
  fileUploadUtils,
  validationUtils
} from './form-helpers'

export {
  // MSW utilities  
  mockScenarios,
  useMockScenario,
  mockAPIResponse,
  resetMockHandlers
} from './msw-helpers'

export {
  // Convex utilities
  MockConvexClient,
  createMockConvexClient,
  createConvexTest,
  createConvexTestWithAuth,
  createMockUserIdentity,
  withAuthenticatedUser,
  withUnauthenticatedUser,
  RealtimeTestHelper
} from './convex'

/**
 * Quick setup functions for common test scenarios
 */
export const quickSetup = {
  /**
   * Setup for authenticated component testing
   */
  authenticatedComponent: () => ({
    render: renderForAuthenticatedUser,
    authState: mockAuthStates.authenticated(),
    user: userInteractionUtils.setupUser()
  }),

  /**
   * Setup for unauthenticated component testing
   */
  unauthenticatedComponent: () => ({
    render: renderForUnauthenticatedUser,
    authState: mockAuthStates.unauthenticated(),
    user: userInteractionUtils.setupUser()
  }),

  /**
   * Setup for form testing
   */
  formTesting: () => ({
    render: renderWithProviders,
    user: userInteractionUtils.setupUser(),
    fillForm: formUtils.fillForm,
    submitForm: formUtils.submitForm
  }),

  /**
   * Setup for file upload testing
   */
  fileUploadTesting: () => ({
    render: renderWithProviders,
    user: userInteractionUtils.setupUser(),
    createFile: fileUploadUtils.createMockFile,
    uploadFiles: fileUploadUtils.uploadFiles,
    dragAndDrop: fileUploadUtils.dragAndDropFiles
  }),

  /**
   * Setup for async testing
   */
  asyncTesting: () => ({
    render: renderWithProviders,
    delay: promiseUtils.delay,
    waitForCondition: pollingUtils.waitForCondition,
    scenario: createAsyncScenario()
  }),

  /**
   * Setup for Convex function testing
   */
  convexTesting: () => ({
    createTest: createConvexTest,
    createTestWithAuth: createConvexTestWithAuth,
    mockClient: createMockConvexClient,
    createUser: createMockUserIdentity,
    realtimeHelper: new RealtimeTestHelper()
  })
}