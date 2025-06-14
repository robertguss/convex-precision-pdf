/**
 * File validation utilities for document processing
 * Provides validation for file type, size, and name
 */

export const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB
export const MAX_FILE_PAGES = 50;
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file size against maximum allowed size
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${fileSizeMB}MB) exceeds maximum limit of ${maxSizeMB}MB`
    };
  }
  
  return { valid: true };
}

/**
 * Validates file type against allowed types
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateFileType(file: File): ValidationResult {
  // Check MIME type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    // Fallback to extension check for cases where MIME type is incorrect
    const extension = getFileExtension(file.name).toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `Invalid file type. Only PDF, JPEG, and PNG files are allowed.`
      };
    }
  }
  
  return { valid: true };
}

/**
 * Validates file name for security and compatibility
 * @param fileName - File name to validate
 * @returns Validation result with error message if invalid
 */
export function validateFileName(fileName: string): ValidationResult {
  // Check for empty name
  if (!fileName || fileName.trim() === '') {
    return {
      valid: false,
      error: 'File name cannot be empty'
    };
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(fileName)) {
    return {
      valid: false,
      error: 'File name contains invalid characters'
    };
  }
  
  // Check for path traversal attempts
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return {
      valid: false,
      error: 'File name contains invalid path characters'
    };
  }
  
  // Check length
  if (fileName.length > 255) {
    return {
      valid: false,
      error: 'File name is too long (maximum 255 characters)'
    };
  }
  
  return { valid: true };
}

/**
 * Comprehensive file validation combining all checks
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateFile(file: File): ValidationResult {
  // Validate file name
  const nameValidation = validateFileName(file.name);
  if (!nameValidation.valid) {
    return nameValidation;
  }
  
  // Validate file type
  const typeValidation = validateFileType(file);
  if (!typeValidation.valid) {
    return typeValidation;
  }
  
  // Validate file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }
  
  return { valid: true };
}

/**
 * Gets file extension from filename
 * @param fileName - File name
 * @returns File extension including dot, or empty string
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot === -1 ? '' : fileName.substring(lastDot);
}

/**
 * Estimates page count for a file
 * @param file - File to estimate
 * @returns Estimated page count
 */
export function estimatePageCount(file: File): number {
  // For images, always 1 page
  if (file.type.startsWith('image/')) {
    return 1;
  }
  
  // For PDFs, estimate based on file size (rough estimate)
  // Average PDF page is roughly 100KB
  if (file.type === 'application/pdf') {
    const estimatedPages = Math.ceil(file.size / (100 * 1024));
    return Math.min(estimatedPages, MAX_FILE_PAGES);
  }
  
  return 1;
}

/**
 * Validates estimated page count against maximum
 * @param pageCount - Estimated page count
 * @returns Validation result with error message if invalid
 */
export function validatePageCount(pageCount: number): ValidationResult {
  if (pageCount > MAX_FILE_PAGES) {
    return {
      valid: false,
      error: `Document has too many pages (${pageCount}). Maximum allowed is ${MAX_FILE_PAGES} pages.`
    };
  }
  
  return { valid: true };
}