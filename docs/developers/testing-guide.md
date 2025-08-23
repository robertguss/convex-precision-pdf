# Testing Guide

Complete guide for testing Precision PDF, including unit tests, E2E tests, and testing best practices.

## 🧪 Testing Stack

### Unit & Integration Testing
- **Vitest** - Fast unit test runner
- **React Testing Library** - Component testing utilities
- **jsdom** - DOM simulation for testing
- **@testing-library/user-event** - User interaction simulation

### End-to-End Testing
- **Playwright** - Cross-browser E2E testing
- **Multiple browsers** - Chromium, Firefox, WebKit
- **Visual testing** - Screenshot comparisons
- **Mobile testing** - Device emulation

## 🚀 Running Tests

### Unit Tests

```bash
# Run all tests once
pnpm run test

# Watch mode (reruns tests on file changes)
pnpm run test:watch

# UI interface for interactive testing
pnpm run test:ui

# Run tests with coverage report
pnpm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests (headless)
pnpm run pw:test

# Interactive UI mode (recommended for development)
pnpm run pw:test:ui

# Debug mode (opens browser for inspection)
pnpm run pw:test:debug

# Run in headed mode (see browser)
pnpm run pw:test:headed

# Generate test report
pnpm run pw:report

# Record new tests interactively
pnpm run pw:codegen
```

### Test Configuration

#### Vitest Configuration (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'test-setup.ts',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
```

#### Playwright Configuration (`playwright.config.ts`)
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 📝 Writing Unit Tests

### Testing Utilities

```typescript
// test/test-utils.tsx
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ConvexProvider } from 'convex/react'
import { ConvexReactClient } from 'convex/react'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### Component Testing Examples

#### Simple Component Test
```typescript
// components/ui/button.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import { Button } from './button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies correct variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByText('Delete')
    expect(button).toHaveClass('bg-destructive')
  })
})
```

#### Complex Component Test
```typescript
// components/DocumentViewer.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { DocumentViewer } from './DocumentViewer'

// Mock Convex queries
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}))

describe('DocumentViewer', () => {
  const mockDocument = {
    _id: 'doc123',
    title: 'Test Document',
    status: 'completed',
    markdown: '# Test Content',
    chunks: [
      {
        chunk_id: 'chunk1',
        content: 'Test content',
        page: 0,
        bbox: { x: 100, y: 100, width: 200, height: 50 }
      }
    ],
    pageCount: 1
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state when document is undefined', () => {
    vi.mocked(useQuery).mockReturnValue(undefined)
    
    render(<DocumentViewer documentId="doc123" />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders document content when loaded', () => {
    vi.mocked(useQuery).mockReturnValue(mockDocument)
    
    render(<DocumentViewer documentId="doc123" />)
    
    expect(screen.getByText('Test Document')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('handles chunk selection', async () => {
    vi.mocked(useQuery).mockReturnValue(mockDocument)
    
    render(<DocumentViewer documentId="doc123" />)
    
    const chunk = screen.getByText('Test content')
    fireEvent.click(chunk)
    
    await waitFor(() => {
      expect(chunk).toHaveClass('selected')
    })
  })
})
```

### Utility Function Testing

```typescript
// utils/documentUtils.test.ts
import { describe, it, expect } from 'vitest'
import { 
  extractDocumentTitle, 
  formatFileSize, 
  validatePDFFile 
} from './documentUtils'

describe('documentUtils', () => {
  describe('extractDocumentTitle', () => {
    it('extracts title from markdown heading', () => {
      const document = {
        markdown: '# Invoice INV-001\n\nCompany: Acme Corp'
      }
      expect(extractDocumentTitle(document)).toBe('Invoice INV-001')
    })

    it('falls back to filename if no heading', () => {
      const document = {
        markdown: 'No heading here',
        title: 'document.pdf'
      }
      expect(extractDocumentTitle(document)).toBe('document.pdf')
    })

    it('returns default title if neither available', () => {
      const document = { markdown: 'No heading' }
      expect(extractDocumentTitle(document)).toBe('Untitled Document')
    })
  })

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1048576)).toBe('1.0 MB')
      expect(formatFileSize(1073741824)).toBe('1.0 GB')
    })

    it('handles zero and negative values', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(-100)).toBe('0 B')
    })
  })

  describe('validatePDFFile', () => {
    it('accepts valid PDF files', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      expect(validatePDFFile(file)).toEqual({ valid: true })
    })

    it('rejects non-PDF files', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const result = validatePDFFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be a PDF')
    })

    it('rejects oversized files', () => {
      const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large.pdf', { 
        type: 'application/pdf' 
      })
      const result = validatePDFFile(largeFile)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too large')
    })
  })
})
```

### API Route Testing

```typescript
// app/api/upload-document/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'
import { auth } from '@clerk/nextjs/server'

// Mock external dependencies
vi.mock('@clerk/nextjs/server')
vi.mock('convex/server')

describe('/api/upload-document', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when authentication is enabled and user not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null })
    
    const request = new Request('http://localhost:3000/api/upload-document', {
      method: 'POST',
      body: new FormData()
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 400 when no file provided', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user123' })
    
    const formData = new FormData()
    const request = new Request('http://localhost:3000/api/upload-document', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('No file provided')
  })

  it('successfully uploads valid PDF file', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user123' })
    
    const file = new File(['pdf content'], 'test.pdf', { 
      type: 'application/pdf' 
    })
    const formData = new FormData()
    formData.append('file', file)

    const request = new Request('http://localhost:3000/api/upload-document', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.documentId).toBeDefined()
  })
})
```

## 🎭 Writing E2E Tests

### Page Object Model

```typescript
// tests/pages/DashboardPage.ts
import { Page, Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly uploadButton: Locator
  readonly fileInput: Locator
  readonly documentList: Locator
  readonly processingStatus: Locator

  constructor(page: Page) {
    this.page = page
    this.uploadButton = page.locator('[data-testid="upload-button"]')
    this.fileInput = page.locator('input[type="file"]')
    this.documentList = page.locator('[data-testid="document-list"]')
    this.processingStatus = page.locator('[data-testid="processing-status"]')
  }

  async goto() {
    await this.page.goto('/dashboard')
  }

  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath)
  }

  async waitForProcessingComplete() {
    await this.processingStatus.waitFor({ 
      state: 'visible',
      timeout: 30000 
    })
    await this.page.waitForFunction(
      () => document.querySelector('[data-testid="processing-status"]')?.textContent?.includes('completed'),
      { timeout: 60000 }
    )
  }

  async getDocumentCount() {
    return await this.documentList.locator('.document-item').count()
  }
}
```

### E2E Test Examples

#### Upload Flow Test
```typescript
// tests/upload.spec.ts
import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/DashboardPage'

test.describe('Document Upload', () => {
  test('should upload and process PDF document', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    
    // Navigate to dashboard
    await dashboard.goto()
    
    // Upload file
    await dashboard.uploadFile('test-files/sample-invoice.pdf')
    
    // Wait for upload to complete
    await expect(page.locator('.upload-success')).toBeVisible()
    
    // Wait for processing
    await dashboard.waitForProcessingComplete()
    
    // Verify document appears in list
    const docCount = await dashboard.getDocumentCount()
    expect(docCount).toBeGreaterThan(0)
    
    // Verify document content is visible
    await expect(page.locator('[data-testid="extracted-content"]')).toBeVisible()
  })

  test('should show error for invalid file type', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    
    await dashboard.goto()
    await dashboard.uploadFile('test-files/invalid.txt')
    
    await expect(page.locator('.error-message')).toContainText('Invalid file type')
  })
})
```

#### Export Flow Test
```typescript
// tests/export.spec.ts
import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Document Export', () => {
  test('should export document as JSON', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Load example document
    await page.goto('/demo/invoice')
    await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible()
    
    // Click export button
    const downloadPromise = page.waitForDownload()
    await page.click('[data-testid="export-json"]')
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('invoice.json')
    
    // Verify file content
    const filePath = path.join(__dirname, 'downloads', download.suggestedFilename())
    await download.saveAs(filePath)
    
    // Basic validation that it's valid JSON
    const fs = require('fs')
    const content = fs.readFileSync(filePath, 'utf8')
    expect(() => JSON.parse(content)).not.toThrow()
  })

  test('should export all documents as ZIP', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Ensure we have documents
    await expect(page.locator('.document-item')).toHaveCount.greaterThan(0)
    
    // Export all
    const downloadPromise = page.waitForDownload()
    await page.click('[data-testid="export-all-json"]')
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/documents.*\.zip/)
  })
})
```

#### Visual Testing
```typescript
// tests/visual.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Visual Tests', () => {
  test('homepage should look correct', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Take screenshot and compare
    await expect(page).toHaveScreenshot('homepage.png')
  })

  test('document viewer should render correctly', async ({ page }) => {
    await page.goto('/demo/invoice')
    
    // Wait for document to load
    await expect(page.locator('[data-testid="pdf-viewer"]')).toBeVisible()
    await expect(page.locator('[data-testid="extracted-content"]')).toBeVisible()
    
    await expect(page).toHaveScreenshot('document-viewer.png')
  })
})
```

### Mobile Testing

```typescript
// tests/mobile.spec.ts
import { test, expect, devices } from '@playwright/test'

test.use(devices['iPhone 13'])

test.describe('Mobile Experience', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.goto('/')
    
    // Check mobile navigation
    await expect(page.locator('.mobile-menu-button')).toBeVisible()
    
    // Test responsive design
    const viewportSize = page.viewportSize()
    expect(viewportSize?.width).toBeLessThan(768)
    
    // Test upload on mobile
    await page.goto('/dashboard')
    await expect(page.locator('.upload-area')).toBeVisible()
  })
})
```

## 🔄 Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run unit tests
        run: pnpm run test
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps
      
      - name: Run E2E tests
        run: pnpm run pw:test
      
      - name: Upload test reports
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## 📊 Test Coverage

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test-setup.ts',
        '*.config.*',
        'coverage/**',
        'dist/**',
        '.next/**',
        'convex/_generated/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  }
})
```

### Coverage Reports

```bash
# Generate coverage report
pnpm run test:coverage

# View HTML coverage report
open coverage/index.html

# View text coverage summary
pnpm run test:coverage -- --reporter=text-summary
```

## 🐛 Testing Best Practices

### Unit Testing Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Keep tests isolated and independent**
4. **Mock external dependencies**
5. **Test edge cases and error conditions**

### E2E Testing Best Practices

1. **Test user workflows, not individual features**
2. **Use Page Object Model for maintainability**
3. **Minimize test data dependencies**
4. **Run tests in isolation**
5. **Use proper wait strategies**

### General Testing Guidelines

1. **Write tests first (TDD) when possible**
2. **Keep tests simple and focused**
3. **Use meaningful assertions**
4. **Clean up after tests (when necessary)**
5. **Keep test data realistic but minimal**

## 🔧 Debugging Tests

### Debugging Unit Tests

```bash
# Run specific test file
pnpm run test documentUtils.test.ts

# Run tests in watch mode with UI
pnpm run test:ui

# Debug with Node.js debugger
node --inspect-brk ./node_modules/vitest/vitest.mjs run

# Run single test
pnpm run test -t "should extract title"
```

### Debugging E2E Tests

```bash
# Run in debug mode (opens browser)
pnpm run pw:test:debug

# Run specific test file
pnpm run pw:test tests/upload.spec.ts

# Run with trace viewer
pnpm run pw:test --trace on

# Generate test with codegen
pnpm run pw:codegen
```

### Test Debugging Tools

```typescript
// Add debug statements in tests
test('debug example', async ({ page }) => {
  await page.goto('/dashboard')
  
  // Pause execution (only in headed mode)
  await page.pause()
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'debug-screenshot.png' })
  
  // Log page content
  const content = await page.content()
  console.log('Page content:', content)
})
```

## 📚 Test Data Management

### Test Fixtures

```typescript
// test/fixtures/documents.ts
export const mockDocuments = {
  invoice: {
    _id: 'doc_invoice_123',
    title: 'Invoice INV-001',
    status: 'completed',
    markdown: '# Invoice INV-001\n\n**Company:** Acme Corp',
    chunks: [
      {
        chunk_id: 'chunk_1',
        content: 'Invoice INV-001',
        page: 0,
        bbox: { x: 100, y: 50, width: 200, height: 30 }
      }
    ],
    pageCount: 1
  },
  
  medical: {
    _id: 'doc_medical_456',
    title: 'Medical Report',
    status: 'processing',
    pageCount: 3
  }
}
```

### Test Files

Create a `test-files/` directory with sample PDFs:

```
test-files/
├── sample-invoice.pdf
├── medical-report.pdf
├── bank-statement.pdf
└── invalid.txt
```

## 🚀 Performance Testing

### Load Testing with Playwright

```typescript
// tests/performance.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('homepage should load within 2 seconds', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(2000)
  })

  test('document processing should complete within 30 seconds', async ({ page }) => {
    await page.goto('/dashboard')
    
    const startTime = Date.now()
    await page.setInputFiles('input[type="file"]', 'test-files/sample.pdf')
    await page.waitForSelector('[data-testid="processing-complete"]', { 
      timeout: 30000 
    })
    const processingTime = Date.now() - startTime
    
    console.log(`Processing time: ${processingTime}ms`)
    expect(processingTime).toBeLessThan(30000)
  })
})
```

## Next Steps

- **[Component Library](./component-library.md)** - UI component documentation
- **[API Reference](./api-reference.md)** - Complete API testing
- **[Contributing Guide](../contributing/CONTRIBUTING.md)** - Contribution guidelines
- **[Deployment Guide](./deployment-guide.md)** - Production testing strategies