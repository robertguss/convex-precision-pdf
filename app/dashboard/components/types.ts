// ABOUTME: Type definitions for dashboard components
// ABOUTME: Includes types for examples, documents, and processing states

export interface Example {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  dataUrl: string;
  staticImageBasePath: string;
  thumbnailUrl: string;
}

export interface ProcessedDocument {
  id: string;
  title: string;
  markdown: string;
  chunks: Array<{
    content: string;
    metadata: Record<string, unknown>;
  }>;
  pageCount: number;
  status: "uploading" | "processing" | "completed" | "failed";
  createdAt: number;
  updatedAt: number;
}

export interface Chunk {
  chunk_id: string;
  content: string;
  page: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata?: Record<string, unknown>;
  // Additional fields for DocumentViewer compatibility
  text?: string;
  chunk_type?: string;
  grounding?: Array<{
    page: number;
    box: {
      l: number;
      t: number;
      r: number;
      b: number;
    };
  }>;
}

export interface DocData {
  markdown: string;
  chunks: Chunk[];
  errors: Array<{ message: string; timestamp?: string }>;
  num_pages: number;
}

export type ExportFormat = '' | 'markdown' | 'json' | 'csv' | 'xlsx';