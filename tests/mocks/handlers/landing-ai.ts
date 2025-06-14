import { http, HttpResponse } from 'msw'

/**
 * Mock Landing AI API responses for testing
 * Simulates document processing and OCR responses
 */

export const DEFAULT_MOCK_DOCUMENT_RESPONSE = {
  pages: [
    {
      page: 1,
      width: 612,
      height: 792,
      chunks: [
        {
          id: 'chunk_1',
          text: 'Sample document text from page 1',
          confidence: 0.95,
          bounding_box: {
            x: 72,
            y: 72,
            width: 468,
            height: 24
          }
        },
        {
          id: 'chunk_2', 
          text: 'Another chunk of text with high confidence',
          confidence: 0.98,
          bounding_box: {
            x: 72,
            y: 108,
            width: 425,
            height: 24
          }
        }
      ]
    },
    {
      page: 2,
      width: 612,
      height: 792,
      chunks: [
        {
          id: 'chunk_3',
          text: 'Content from the second page',
          confidence: 0.92,
          bounding_box: {
            x: 72,
            y: 72,
            width: 380,
            height: 24
          }
        }
      ]
    }
  ],
  metadata: {
    total_pages: 2,
    processing_time_ms: 1250,
    confidence_threshold: 0.8,
    detected_language: 'en'
  }
}

export const DEFAULT_MOCK_PROCESSING_STATUS = {
  job_id: 'job_test123',
  status: 'completed',
  progress: 100,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  result_url: '/api/results/job_test123'
}

export const landingAIHandlers = [
  /**
   * Mock document upload and processing initiation
   */
  http.post('*/api/process-document', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return HttpResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Simulate file type validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return HttpResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    // Simulate file size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return HttpResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      job_id: 'job_test123',
      status: 'processing',
      progress: 0,
      estimated_completion: new Date(Date.now() + 30000).toISOString() // 30 seconds
    }, { status: 202 })
  }),

  /**
   * Mock processing status check
   */
  http.get('*/api/process-status/:jobId', ({ params }) => {
    const { jobId } = params
    
    // Simulate different status responses based on job ID
    if (jobId === 'job_failed123') {
      return HttpResponse.json({
        job_id: jobId,
        status: 'failed',
        progress: 50,
        error: 'Processing failed due to corrupted file',
        created_at: new Date(Date.now() - 60000).toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    if (jobId === 'job_processing123') {
      return HttpResponse.json({
        job_id: jobId,
        status: 'processing',
        progress: 75,
        created_at: new Date(Date.now() - 30000).toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    return HttpResponse.json({
      ...DEFAULT_MOCK_PROCESSING_STATUS,
      job_id: jobId as string
    })
  }),

  /**
   * Mock processed document results
   */
  http.get('*/api/results/:jobId', ({ params }) => {
    const { jobId } = params
    
    if (jobId === 'job_failed123') {
      return HttpResponse.json(
        { error: 'Job failed or not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(DEFAULT_MOCK_DOCUMENT_RESPONSE)
  }),

  /**
   * Mock image generation from PDF pages
   */
  http.get('*/api/page-image/:jobId/:pageNumber', ({ params }) => {
    const { jobId, pageNumber } = params
    
    // Return a simple base64 encoded 1x1 pixel PNG for testing
    const mockImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    
    return HttpResponse.arrayBuffer(
      Uint8Array.from(atob(mockImageData), c => c.charCodeAt(0)).buffer,
      {
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': '68'
        }
      }
    )
  }),

  /**
   * Mock chunk extraction for specific pages
   */
  http.post('*/api/extract-chunks', async ({ request }) => {
    const body = await request.json() as any
    const { job_id, pages } = body
    
    if (!job_id || !pages) {
      return HttpResponse.json(
        { error: 'Missing job_id or pages' },
        { status: 400 }
      )
    }

    // Filter chunks based on requested pages
    const filteredPages = DEFAULT_MOCK_DOCUMENT_RESPONSE.pages.filter(
      page => pages.includes(page.page)
    )

    return HttpResponse.json({
      ...DEFAULT_MOCK_DOCUMENT_RESPONSE,
      pages: filteredPages,
      metadata: {
        ...DEFAULT_MOCK_DOCUMENT_RESPONSE.metadata,
        total_pages: filteredPages.length,
        requested_pages: pages
      }
    })
  }),

  /**
   * Mock API health check
   */
  http.get('*/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        ocr_engine: 'available',
        storage: 'available',
        queue: 'available'
      }
    })
  })
]

/**
 * Helper functions for test scenarios
 */
export const landingAIMockHelpers = {
  /**
   * Create a mock document response with custom content
   */
  mockDocumentResponse: (overrides: Partial<typeof DEFAULT_MOCK_DOCUMENT_RESPONSE> = {}) => ({
    ...DEFAULT_MOCK_DOCUMENT_RESPONSE,
    ...overrides
  }),

  /**
   * Mock a processing job in progress
   */
  mockProcessingJob: (jobId: string = 'job_test123', progress: number = 50) => {
    return http.get(`*/api/process-status/${jobId}`, () => {
      return HttpResponse.json({
        job_id: jobId,
        status: 'processing',
        progress,
        created_at: new Date(Date.now() - 30000).toISOString(),
        updated_at: new Date().toISOString()
      })
    })
  },

  /**
   * Mock a failed processing job
   */
  mockFailedJob: (jobId: string = 'job_test123', error: string = 'Processing failed') => {
    return http.get(`*/api/process-status/${jobId}`, () => {
      return HttpResponse.json({
        job_id: jobId,
        status: 'failed',
        progress: 0,
        error,
        created_at: new Date(Date.now() - 60000).toISOString(),
        updated_at: new Date().toISOString()
      })
    })
  },

  /**
   * Mock API timeout/unavailable
   */
  mockApiTimeout: () => {
    return http.post('*/api/process-document', () => {
      return HttpResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    })
  },

  /**
   * Mock a large document with many pages
   */
  mockLargeDocument: (pageCount: number = 10) => {
    const pages = Array.from({ length: pageCount }, (_, index) => ({
      page: index + 1,
      width: 612,
      height: 792,
      chunks: [
        {
          id: `chunk_${index + 1}_1`,
          text: `Content from page ${index + 1}`,
          confidence: 0.9 + Math.random() * 0.1,
          bounding_box: {
            x: 72,
            y: 72,
            width: 400,
            height: 24
          }
        }
      ]
    }))

    return {
      pages,
      metadata: {
        total_pages: pageCount,
        processing_time_ms: pageCount * 500,
        confidence_threshold: 0.8,
        detected_language: 'en'
      }
    }
  }
}