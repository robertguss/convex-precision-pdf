/**
 * ABOUTME: Comprehensive unit tests for export format utilities
 * ABOUTME: Tests JSON, Markdown, Text, DOCX, XLSX, and CSV export functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { 
  exportChunks, 
  downloadFile, 
  downloadBlob 
} from '../../../app/dashboard/components/utils/exportUtils'
import { generateChunk, generateMultipleChunks } from '../../utils/data/generators/chunks'
import type { ExportFormat } from '../../../app/dashboard/components/types'

// Mock DOM elements and APIs that aren't covered by setup.ts
const mockLink = {
  href: '',
  download: '',
  style: { display: '' },
  click: vi.fn(),
}

const mockCreateElement = vi.fn(() => mockLink)
const mockAppendChild = vi.fn()
const mockRemoveChild = vi.fn()

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true
})

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true
})

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true
})

// Mock alert
global.alert = vi.fn()

describe('Export Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLink.href = ''
    mockLink.download = ''
    mockLink.style.display = ''
  })

  describe('exportChunks', () => {
    const mockChunks = generateMultipleChunks(3)
    const documentBasename = 'test-document'

    it('should handle empty chunks array', async () => {
      await exportChunks([], 'json', documentBasename)
      
      expect(console.warn).toHaveBeenCalledWith('No chunks to export.')
    })

    it('should route to JSON export for json format', async () => {
      server.use(
        http.post('/api/export/json', () => {
          return HttpResponse.json({ chunks: mockChunks })
        })
      )

      await exportChunks(mockChunks, 'json', documentBasename)
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink)
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe(`${documentBasename}_selection.json`)
    })

    it('should route to Markdown export for markdown format', async () => {
      const markdownContent = '# Test Document\\n\\nContent here'
      server.use(
        http.post('/api/export/markdown', () => {
          return HttpResponse.text(markdownContent)
        })
      )

      await exportChunks(mockChunks, 'markdown', documentBasename)
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe(`${documentBasename}_selection.md`)
    })

    it('should route to Text export for text format', async () => {
      const textContent = 'Plain text content'
      server.use(
        http.post('/api/export/text', () => {
          return HttpResponse.text(textContent)
        })
      )

      await exportChunks(mockChunks, 'text', documentBasename)
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe(`${documentBasename}_selection.txt`)
    })

    it('should route to DOCX export for docx format', async () => {
      const mockArrayBuffer = new ArrayBuffer(100)
      server.use(
        http.post('/api/export/docx', () => {
          return HttpResponse.arrayBuffer(mockArrayBuffer)
        })
      )

      await exportChunks(mockChunks, 'docx', documentBasename)
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe(`${documentBasename}_selection.docx`)
    })

    it('should route to CSV export for csv format', async () => {
      const csvContent = 'chunk_id,content,page\\nchunk1,content1,1'
      server.use(
        http.post('/api/export/csv', () => {
          return HttpResponse.text(csvContent)
        })
      )

      await exportChunks(mockChunks, 'csv', documentBasename)
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe(`${documentBasename}_selection.csv`)
    })

    it('should route to XLSX export for xlsx format', async () => {
      const mockArrayBuffer = new ArrayBuffer(100)
      server.use(
        http.post('/api/export/xlsx', () => {
          return HttpResponse.arrayBuffer(mockArrayBuffer)
        })
      )

      await exportChunks(mockChunks, 'xlsx', documentBasename)
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe(`${documentBasename}_selection.xlsx`)
    })

    it('should handle unsupported export format', async () => {
      await exportChunks(mockChunks, 'unsupported' as ExportFormat, documentBasename)
      
      expect(console.warn).toHaveBeenCalledWith('Export format unsupported not supported yet.')
      expect(global.alert).toHaveBeenCalledWith('Export format unsupported not supported yet.')
    })

    it('should handle empty format', async () => {
      await exportChunks(mockChunks, '', documentBasename)
      
      expect(console.warn).toHaveBeenCalledWith('Export format  not supported yet.')
      expect(global.alert).toHaveBeenCalledWith('Export format  not supported yet.')
    })
  })

  describe('JSON Export', () => {
    const mockChunks = generateMultipleChunks(2)
    const documentBasename = 'test-document'

    it('should successfully export chunks as JSON', async () => {
      const responseData = { chunks: mockChunks }
      server.use(
        http.post('/api/export/json', () => {
          return HttpResponse.json(responseData)
        })
      )

      await exportChunks(mockChunks, 'json', documentBasename)
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.href).toBe('mocked-url')
      expect(mockLink.download).toBe(`${documentBasename}_selection.json`)
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('should handle JSON export API errors', async () => {
      server.use(
        http.post('/api/export/json', () => {
          return HttpResponse.text('Internal Server Error', { status: 500 })
        })
      )

      await exportChunks(mockChunks, 'json', documentBasename)
      
      expect(console.error).toHaveBeenCalledWith('Failed to export JSON:', expect.any(Error))
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Error exporting to JSON:'))
    })

    it('should handle network errors for JSON export', async () => {
      server.use(
        http.post('/api/export/json', () => {
          return HttpResponse.error()
        })
      )

      await exportChunks(mockChunks, 'json', documentBasename)
      
      expect(console.error).toHaveBeenCalledWith('Failed to export JSON:', expect.any(Error))
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Error exporting to JSON:'))
    })
  })

  describe('Markdown Export', () => {
    const mockChunks = generateMultipleChunks(2)
    const documentBasename = 'test-document'

    it('should successfully export chunks as Markdown', async () => {
      const markdownContent = '# Test Document\\n\\nContent from chunks'
      server.use(
        http.post('/api/export/markdown', () => {
          return HttpResponse.text(markdownContent)
        })
      )

      await exportChunks(mockChunks, 'markdown', documentBasename)
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.href).toBe('mocked-url')
      expect(mockLink.download).toBe(`${documentBasename}_selection.md`)
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('should handle Markdown export API errors', async () => {
      server.use(
        http.post('/api/export/markdown', () => {
          return HttpResponse.text('Bad Request', { status: 400 })
        })
      )

      await exportChunks(mockChunks, 'markdown', documentBasename)
      
      expect(console.error).toHaveBeenCalledWith('Failed to export Markdown:', expect.any(Error))
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Error exporting to Markdown:'))
    })
  })

  describe('Text Export', () => {
    const mockChunks = generateMultipleChunks(2)
    const documentBasename = 'test-document'

    it('should successfully export chunks as plain text', async () => {
      const textContent = 'Plain text content from chunks'
      server.use(
        http.post('/api/export/text', () => {
          return HttpResponse.text(textContent)
        })
      )

      await exportChunks(mockChunks, 'text', documentBasename)
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.href).toBe('mocked-url')
      expect(mockLink.download).toBe(`${documentBasename}_selection.txt`)
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('should handle Text export API errors', async () => {
      server.use(
        http.post('/api/export/text', () => {
          return HttpResponse.text('Unauthorized', { status: 401 })
        })
      )

      await exportChunks(mockChunks, 'text', documentBasename)
      
      expect(console.error).toHaveBeenCalledWith('Failed to export Text:', expect.any(Error))
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Error exporting to Text:'))
    })
  })

  describe('DOCX Export', () => {
    const mockChunks = generateMultipleChunks(2)
    const documentBasename = 'test-document'

    it('should successfully export chunks as DOCX', async () => {
      const mockArrayBuffer = new ArrayBuffer(100)
      server.use(
        http.post('/api/export/docx', () => {
          return HttpResponse.arrayBuffer(mockArrayBuffer)
        })
      )

      await exportChunks(mockChunks, 'docx', documentBasename)
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.href).toBe('mocked-url')
      expect(mockLink.download).toBe(`${documentBasename}_selection.docx`)
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('should handle DOCX export API errors', async () => {
      server.use(
        http.post('/api/export/docx', () => {
          return HttpResponse.text('Service Unavailable', { status: 503 })
        })
      )

      await exportChunks(mockChunks, 'docx', documentBasename)
      
      expect(console.error).toHaveBeenCalledWith('Failed to export DOCX:', expect.any(Error))
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Error exporting to DOCX:'))
    })
  })

  describe('CSV Export', () => {
    const mockChunks = generateMultipleChunks(2)
    const documentBasename = 'test-document'

    it('should successfully export chunks as CSV', async () => {
      const csvContent = 'chunk_id,content,page\\nchunk1,content1,1\\nchunk2,content2,2'
      server.use(
        http.post('/api/export/csv', () => {
          return HttpResponse.text(csvContent)
        })
      )

      await exportChunks(mockChunks, 'csv', documentBasename)
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.href).toBe('mocked-url')
      expect(mockLink.download).toBe(`${documentBasename}_selection.csv`)
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('should handle CSV export API errors', async () => {
      server.use(
        http.post('/api/export/csv', () => {
          return HttpResponse.text('Forbidden', { status: 403 })
        })
      )

      await exportChunks(mockChunks, 'csv', documentBasename)
      
      expect(console.error).toHaveBeenCalledWith('Failed to export CSV:', expect.any(Error))
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Error exporting to CSV:'))
    })
  })

  describe('XLSX Export', () => {
    const mockChunks = generateMultipleChunks(2)
    const documentBasename = 'test-document'

    it('should successfully export chunks as XLSX', async () => {
      const mockArrayBuffer = new ArrayBuffer(100)
      server.use(
        http.post('/api/export/xlsx', () => {
          return HttpResponse.arrayBuffer(mockArrayBuffer)
        })
      )

      await exportChunks(mockChunks, 'xlsx', documentBasename)
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.href).toBe('mocked-url')
      expect(mockLink.download).toBe(`${documentBasename}_selection.xlsx`)
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('should handle XLSX export API errors', async () => {
      server.use(
        http.post('/api/export/xlsx', () => {
          return HttpResponse.text('Too Many Requests', { status: 429 })
        })
      )

      await exportChunks(mockChunks, 'xlsx', documentBasename)
      
      expect(console.error).toHaveBeenCalledWith('Failed to export XLSX:', expect.any(Error))
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Error exporting to XLSX:'))
    })
  })

  describe('Download Utilities', () => {
    describe('downloadFile', () => {
      it('should create and download a text file', () => {
        const content = 'Test file content'
        const mimeType = 'text/plain'
        const filename = 'test.txt'

        downloadFile(content, mimeType, filename)

        expect(window.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
        expect(mockLink.href).toBe('mocked-url')
        expect(mockLink.download).toBe(filename)
        expect(mockLink.click).toHaveBeenCalled()
        expect(mockAppendChild).toHaveBeenCalledWith(mockLink)
      })

      it('should handle JSON content with proper formatting', () => {
        const jsonObject = { test: 'data', nested: { value: 123 } }
        const content = JSON.stringify(jsonObject, null, 2)
        const mimeType = 'application/json'
        const filename = 'test.json'

        downloadFile(content, mimeType, filename)

        expect(window.URL.createObjectURL).toHaveBeenCalledWith(
          expect.objectContaining({
            type: mimeType
          })
        )
        expect(mockLink.download).toBe(filename)
      })
    })

    describe('downloadBlob', () => {
      it('should download a blob with correct filename', () => {
        const blob = new Blob(['test content'], { type: 'text/plain' })
        const filename = 'test-blob.txt'

        downloadBlob(blob, filename)

        expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob)
        expect(mockLink.href).toBe('mocked-url')
        expect(mockLink.download).toBe(filename)
        expect(mockLink.click).toHaveBeenCalled()
        expect(mockAppendChild).toHaveBeenCalledWith(mockLink)
      })

      it('should clean up object URL and DOM element', (done) => {
        const blob = new Blob(['test content'])
        const filename = 'test.txt'

        downloadBlob(blob, filename)

        // Wait for cleanup timeout
        setTimeout(() => {
          expect(mockRemoveChild).toHaveBeenCalledWith(mockLink)
          expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('mocked-url')
          done()
        }, 150)
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle chunks with special characters in content', async () => {
      const specialChunks = [
        generateChunk({ content: 'Content with "quotes" and \\backslashes\\' }),
        generateChunk({ content: 'Unicode content: 🔥 💯 ⚡' }),
        generateChunk({ content: 'Content with <HTML> tags & entities' })
      ]

      server.use(
        http.post('/api/export/json', () => {
          return HttpResponse.json({ chunks: specialChunks })
        })
      )

      await exportChunks(specialChunks, 'json', 'special-chars-test')
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe('special-chars-test_selection.json')
    })

    it('should handle very long document basenames', async () => {
      const longBasename = 'a'.repeat(200)
      const mockChunks = generateMultipleChunks(1)

      server.use(
        http.post('/api/export/text', () => {
          return HttpResponse.text('content')
        })
      )

      await exportChunks(mockChunks, 'text', longBasename)
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.download).toBe(`${longBasename}_selection.txt`)
    })

    it('should handle chunks with missing or null metadata', async () => {
      const chunksWithNullMetadata = [
        generateChunk({ metadata: undefined as any }),
        generateChunk({ metadata: null as any }),
        generateChunk({ metadata: {} })
      ]

      server.use(
        http.post('/api/export/json', () => {
          return HttpResponse.json({ chunks: chunksWithNullMetadata })
        })
      )

      await exportChunks(chunksWithNullMetadata, 'json', 'null-metadata-test')
      
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
    })
  })

  describe('API Request Validation', () => {
    it('should send correct request payload for JSON export', async () => {
      const mockChunks = generateMultipleChunks(2)
      let requestBody: any

      server.use(
        http.post('/api/export/json', async ({ request }) => {
          requestBody = await request.json()
          return HttpResponse.json({ chunks: mockChunks })
        })
      )

      await exportChunks(mockChunks, 'json', 'payload-test')
      
      expect(requestBody).toEqual({ chunks: mockChunks })
    })

    it('should include correct headers in requests', async () => {
      const mockChunks = generateMultipleChunks(1)
      let capturedHeaders: Record<string, string> = {}

      server.use(
        http.post('/api/export/markdown', async ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries())
          return HttpResponse.text('markdown content')
        })
      )

      await exportChunks(mockChunks, 'markdown', 'headers-test')
      
      expect(capturedHeaders['content-type']).toBe('application/json')
    })
  })
})