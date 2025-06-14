# Test Utilities

This directory contains comprehensive test utilities for the PrecisionPDF application. These utilities provide consistent patterns for testing components, forms, authentication, async operations, and more.

## Quick Start

```typescript
import { 
  renderForAuthenticatedUser, 
  userInteractionUtils, 
  fileUploadUtils,
  mockAuthStates 
} from '../utils'

// Test an authenticated component
test('renders dashboard for authenticated user', () => {
  renderForAuthenticatedUser(<Dashboard />)
  expect(screen.getByText('Welcome')).toBeInTheDocument()
})

// Test file upload
test('handles file upload', async () => {
  const user = userInteractionUtils.setupUser()
  const file = fileUploadUtils.commonFiles.pdf()
  
  renderWithProviders(<FileUpload />)
  await fileUploadUtils.uploadFiles('file-input', [file])
  
  expect(screen.getByText('test.pdf')).toBeInTheDocument()
})
```

## Utilities Overview

### 1. Render Helpers (`render-helpers.tsx`)

Provides consistent rendering with all necessary providers (Clerk, Convex, React Query).

#### Key Functions:
- `renderWithProviders()` - Render with all providers
- `renderForAuthenticatedUser()` - Pre-configured for authenticated state
- `renderForUnauthenticatedUser()` - Pre-configured for unauthenticated state
- `renderWithClerkOnly()` - Only Clerk provider
- `renderWithConvexOnly()` - Only Convex provider

#### Usage:
```typescript
import { renderForAuthenticatedUser } from '../utils'

test('authenticated component', () => {
  renderForAuthenticatedUser(<MyComponent />, {
    authState: { userId: 'custom-user-id' }
  })
})
```

### 2. Auth Mocking (`auth-mocking.ts`)

Comprehensive authentication mocking for Clerk integration.

#### Key Functions:
- `mockAuthStates` - Pre-defined auth states
- `setupAuthMocks()` - Setup auth mocks for a test
- `authTestUtils` - Utilities for auth flow testing

#### Auth States:
- `authenticated()` - Fully authenticated user
- `unauthenticated()` - Not signed in
- `loading()` - Auth still loading
- `proUser()` - Pro subscription user
- `businessUser()` - Business subscription user

#### Usage:
```typescript
import { mockAuthStates, setupAuthMocks } from '../utils'

test('pro user features', () => {
  const authState = mockAuthStates.proUser()
  setupAuthMocks(authState)
  
  render(<ProFeatures />)
  expect(screen.getByText('Pro Dashboard')).toBeInTheDocument()
})
```

### 3. Async Helpers (`async-helpers.ts`)

Utilities for testing asynchronous operations, timers, and promises.

#### Key Modules:
- `timerUtils` - Fake timer control
- `promiseUtils` - Promise creation and management
- `mockUtils` - Mock function creation
- `pollingUtils` - Condition waiting
- `AsyncTestScenario` - Complex async test scenarios

#### Usage:
```typescript
import { timerUtils, promiseUtils, pollingUtils } from '../utils'

test('async operation', async () => {
  timerUtils.useFakeTimers()
  
  const promise = promiseUtils.resolveAfter('result', 1000)
  timerUtils.advanceTimersByTime(1000)
  
  const result = await promise
  expect(result).toBe('result')
  
  timerUtils.useRealTimers()
})

test('wait for condition', async () => {
  let value = false
  setTimeout(() => { value = true }, 500)
  
  await pollingUtils.waitForCondition(() => value, { timeout: 1000 })
  expect(value).toBe(true)
})
```

### 4. Form Helpers (`form-helpers.ts`)

Comprehensive form and file upload testing utilities.

#### Key Modules:
- `userInteractionUtils` - User event simulation
- `formUtils` - Form interaction helpers
- `fileUploadUtils` - File upload testing
- `validationUtils` - Form validation testing

#### Form Testing:
```typescript
import { formUtils, userInteractionUtils } from '../utils'

test('form submission', async () => {
  render(<ContactForm />)
  
  await formUtils.fillForm({
    'Email': 'test@example.com',
    'Message': 'Hello world',
    'Subscribe': true
  })
  
  await formUtils.submitForm()
  expect(screen.getByText('Form submitted')).toBeInTheDocument()
})
```

#### File Upload Testing:
```typescript
import { fileUploadUtils } from '../utils'

test('file upload', async () => {
  render(<FileUpload />)
  
  const files = [
    fileUploadUtils.commonFiles.pdf('document.pdf'),
    fileUploadUtils.commonFiles.image('photo.jpg')
  ]
  
  await fileUploadUtils.uploadFiles('file-input', files)
  expect(screen.getByText('2 files selected')).toBeInTheDocument()
})

test('drag and drop', async () => {
  render(<DragDropUpload />)
  
  const file = fileUploadUtils.commonFiles.pdf()
  await fileUploadUtils.dragAndDropFiles('drop-zone', [file])
  
  expect(screen.getByText('File uploaded')).toBeInTheDocument()
})
```

### 5. MSW Helpers (`msw-helpers.ts`)

Mock Service Worker utilities for API mocking (extends existing implementation).

#### Key Functions:
- `mockScenarios` - Pre-defined API scenarios
- `useMockScenario()` - Apply a scenario
- `mockAPIResponse()` - Custom API responses
- `resetMockHandlers()` - Reset to defaults

#### Usage:
```typescript
import { mockScenarios, useMockScenario } from '../utils'

test('pro user subscription', () => {
  useMockScenario(mockScenarios.authenticatedProUser())
  
  render(<SubscriptionStatus />)
  expect(screen.getByText('Pro Plan')).toBeInTheDocument()
})
```

## Common Patterns

### Testing Authenticated Components

```typescript
import { renderForAuthenticatedUser, mockAuthStates } from '../utils'

test('dashboard access', () => {
  renderForAuthenticatedUser(<Dashboard />, {
    authState: mockAuthStates.proUser()
  })
  
  expect(screen.getByText('Pro Dashboard')).toBeInTheDocument()
})
```

### Testing Forms with Validation

```typescript
import { formUtils, validationUtils } from '../utils'

test('form validation', async () => {
  render(<SignupForm />)
  
  await formUtils.fillForm({
    'Email': 'invalid-email',
    'Password': '123'
  })
  
  await formUtils.submitForm()
  
  await formUtils.validateForm({
    'Email': 'Please enter a valid email',
    'Password': 'Password must be at least 8 characters'
  })
})
```

### Testing File Upload with Progress

```typescript
import { fileUploadUtils, uploadProgressUtils } from '../utils'

test('upload progress', async () => {
  const progressMock = uploadProgressUtils.createMockUploadProgress(2000, 5)
  let currentProgress = 0
  
  progressMock.onProgress((progress) => {
    currentProgress = progress
  })
  
  progressMock.start()
  
  // Test progress updates
  await waitFor(() => {
    expect(currentProgress).toBeGreaterThan(0)
  })
})
```

### Testing Async Operations

```typescript
import { createAsyncScenario, pollingUtils } from '../utils'

test('complex async flow', async () => {
  await createAsyncScenario()
    .step(() => userInteractionUtils.clickElement('Start Process'))
    .waitFor(() => screen.queryByText('Processing...') !== null)
    .delay(1000)
    .waitFor(() => screen.queryByText('Complete') !== null)
    .execute()
})
```

### Testing Error States

```typescript
import { mockErrors, mockAPIResponse } from '../utils'

test('handles API errors', async () => {
  mockAPIResponse(mockErrors.serverError('/api/documents'))
  
  render(<DocumentList />)
  
  await waitFor(() => {
    expect(screen.getByText('Error loading documents')).toBeInTheDocument()
  })
})
```

## Quick Setup Functions

The `quickSetup` object provides pre-configured setups for common scenarios:

```typescript
import { quickSetup } from '../utils'

test('authenticated form', async () => {
  const { render, user, fillForm } = quickSetup.formTesting()
  
  render(<AuthenticatedForm />)
  await fillForm({ name: 'John Doe' })
})

test('file upload component', async () => {
  const { render, createFile, uploadFiles } = quickSetup.fileUploadTesting()
  
  render(<FileUploader />)
  const file = createFile('test.pdf')
  await uploadFiles('input', [file])
})
```

## Best Practices

1. **Always use the provided render helpers** instead of raw React Testing Library render
2. **Use realistic mock data** from the provided generators
3. **Test both success and error scenarios** using MSW scenarios
4. **Clean up timers and mocks** in test cleanup
5. **Use async utilities** for testing loading states and API calls
6. **Validate accessibility** using the a11y utilities
7. **Test keyboard navigation** for forms and interactive elements

## Integration with Existing Tests

These utilities are designed to work with the existing MSW setup and test infrastructure. Simply import what you need:

```typescript
// Import everything
import * from '../utils'

// Import specific utilities
import { renderForAuthenticatedUser, userInteractionUtils } from '../utils'

// Use quick setup
import { quickSetup } from '../utils'
const { render, user } = quickSetup.authenticatedComponent()
```

## File Structure

```
tests/utils/
├── index.ts              # Main exports
├── render-helpers.tsx    # Provider rendering utilities
├── auth-mocking.ts       # Authentication mocking
├── async-helpers.ts      # Async operation utilities
├── form-helpers.ts       # Form and file upload testing
├── msw-helpers.ts        # MSW API mocking (existing)
└── README.md             # This documentation
```