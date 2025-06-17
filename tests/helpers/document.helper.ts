/**
 * Document helper functions for Playwright tests
 * Handles document upload, processing, and interaction
 */

import { Page, expect } from '@playwright/test';
import path from 'path';

/**
 * Upload a file using the file uploader
 */
export async function uploadFile(
  page: Page,
  fileName: string,
  mimeType: string = 'application/pdf'
) {
  // Get the file input element
  const fileInput = page.locator('input[type="file"]');
  
  // Set the file to upload
  const filePath = path.join(process.cwd(), 'tests', 'fixtures', fileName);
  await fileInput.setInputFiles(filePath);
  
  // Wait for upload to start
  await expect(page.locator('[data-cy="upload-progress"]')).toBeVisible();
}

/**
 * Upload file using drag and drop
 */
export async function uploadFileWithDragDrop(
  page: Page,
  fileName: string
) {
  const filePath = path.join(process.cwd(), 'tests', 'fixtures', fileName);
  
  // Read file content
  const buffer = await page.evaluateHandle(async (filePath) => {
    const response = await fetch(`file://${filePath}`);
    const data = await response.arrayBuffer();
    return new File([data], fileName, { type: 'application/pdf' });
  }, filePath);
  
  // Create data transfer
  const dataTransfer = await page.evaluateHandle((file) => {
    const dt = new DataTransfer();
    dt.items.add(file);
    return dt;
  }, buffer);
  
  // Perform drag and drop
  const dropZone = page.locator('[data-cy="drop-zone"]');
  await dropZone.dispatchEvent('drop', { dataTransfer });
  
  // Clean up
  await buffer.dispose();
  await dataTransfer.dispose();
}

/**
 * Wait for document processing to complete
 */
export async function waitForProcessing(page: Page, timeout: number = 60000) {
  // Wait for processing indicator to appear
  await expect(page.locator('[data-cy="processing-indicator"]')).toBeVisible();
  
  // Wait for processing to complete
  await expect(page.locator('[data-cy="processing-complete"]')).toBeVisible({
    timeout,
  });
  
  // Ensure document viewer is loaded
  await expect(page.locator('[data-cy="document-viewer"]')).toBeVisible();
}

/**
 * Select text chunks in the document viewer
 */
export async function selectChunks(page: Page, chunkIndices: number[]) {
  for (const index of chunkIndices) {
    const chunk = page.locator(`[data-cy="chunk-${index}"]`);
    await chunk.click();
    
    // Verify chunk is selected
    await expect(chunk).toHaveClass(/selected/);
  }
}

/**
 * Deselect all chunks
 */
export async function deselectAllChunks(page: Page) {
  await page.locator('[data-cy="deselect-all-button"]').click();
  
  // Verify no chunks are selected
  const selectedChunks = page.locator('[data-cy*="chunk-"].selected');
  await expect(selectedChunks).toHaveCount(0);
}

/**
 * Navigate to specific page in document
 */
export async function navigateToPage(page: Page, pageNumber: number) {
  // Use page navigation controls
  const pageInput = page.locator('[data-cy="page-input"]');
  await pageInput.fill(pageNumber.toString());
  await pageInput.press('Enter');
  
  // Wait for page to load
  await expect(page.locator(`[data-cy="page-${pageNumber}"]`)).toBeVisible();
}

/**
 * Zoom document viewer
 */
export async function setZoom(page: Page, zoomLevel: number) {
  const zoomSelect = page.locator('[data-cy="zoom-select"]');
  await zoomSelect.selectOption({ value: zoomLevel.toString() });
  
  // Wait for zoom to apply
  await page.waitForTimeout(500);
}

/**
 * Export selected chunks
 */
export async function exportChunks(
  page: Page,
  format: 'txt' | 'md' | 'docx' | 'json'
) {
  // Open export modal
  await page.locator('[data-cy="export-button"]').click();
  
  // Select format
  await page.locator(`[data-cy="export-format-${format}"]`).click();
  
  // Click export
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-cy="confirm-export-button"]').click();
  
  // Wait for download
  const download = await downloadPromise;
  return download;
}

/**
 * Verify document metadata
 */
export async function verifyDocumentMetadata(
  page: Page,
  expectedMetadata: {
    name?: string;
    pages?: number;
    chunks?: number;
    status?: string;
  }
) {
  if (expectedMetadata.name) {
    await expect(page.locator('[data-cy="document-name"]')).toContainText(
      expectedMetadata.name
    );
  }
  
  if (expectedMetadata.pages) {
    await expect(page.locator('[data-cy="page-count"]')).toContainText(
      expectedMetadata.pages.toString()
    );
  }
  
  if (expectedMetadata.chunks) {
    await expect(page.locator('[data-cy="chunk-count"]')).toContainText(
      expectedMetadata.chunks.toString()
    );
  }
  
  if (expectedMetadata.status) {
    await expect(page.locator('[data-cy="document-status"]')).toContainText(
      expectedMetadata.status
    );
  }
}

/**
 * Delete document
 */
export async function deleteDocument(page: Page, documentId?: string) {
  if (documentId) {
    // Navigate to specific document
    await page.goto(`/documents/${documentId}`);
  }
  
  // Open document actions menu
  await page.locator('[data-cy="document-actions"]').click();
  
  // Click delete
  await page.locator('[data-cy="delete-document-button"]').click();
  
  // Confirm deletion
  await page.locator('[data-cy="confirm-delete-button"]').click();
  
  // Wait for deletion to complete
  await expect(page.locator('[data-cy="document-deleted"]')).toBeVisible();
}

/**
 * Search within document
 */
export async function searchInDocument(page: Page, searchTerm: string) {
  // Open search
  await page.locator('[data-cy="search-button"]').click();
  
  // Enter search term
  const searchInput = page.locator('[data-cy="search-input"]');
  await searchInput.fill(searchTerm);
  await searchInput.press('Enter');
  
  // Wait for search results
  await expect(page.locator('[data-cy="search-results"]')).toBeVisible();
}

/**
 * Clear all test documents
 */
export async function clearTestDocuments(page: Page) {
  // Navigate to documents page
  await page.goto('/documents');
  
  // Select all documents
  await page.locator('[data-cy="select-all-documents"]').click();
  
  // Delete selected
  await page.locator('[data-cy="bulk-delete-button"]').click();
  
  // Confirm deletion
  await page.locator('[data-cy="confirm-bulk-delete-button"]').click();
  
  // Wait for deletion to complete
  await expect(page.locator('[data-cy="no-documents"]')).toBeVisible();
}

/**
 * Get processing progress
 */
export async function getProcessingProgress(page: Page): Promise<number> {
  const progressBar = page.locator('[data-cy="processing-progress"]');
  const progressText = await progressBar.getAttribute('aria-valuenow');
  return parseInt(progressText || '0', 10);
}

/**
 * Wait for specific processing stage
 */
export async function waitForProcessingStage(
  page: Page,
  stage: 'uploading' | 'processing' | 'extracting' | 'complete'
) {
  const stageIndicator = page.locator(`[data-cy="stage-${stage}"]`);
  await expect(stageIndicator).toBeVisible({ timeout: 30000 });
}