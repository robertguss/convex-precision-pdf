import { describe, it, expect } from 'vitest';
import {
  validateFile,
  validateFileSize,
  validateFileType,
  validateFileName,
  validatePageCount,
  estimatePageCount,
  getFileExtension,
  MAX_FILE_SIZE,
  MAX_FILE_PAGES,
  ALLOWED_FILE_TYPES,
  ALLOWED_FILE_EXTENSIONS
} from '@/utils/validation';

/**
 * Unit tests for file validation utilities
 * Tests file size, type, name validation and helper functions
 */

describe('File Validation', () => {
  
  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB
      
      const result = validateFileSize(file);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('should reject files exceeding size limit', () => {
      const file = new File(['content'], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 300 * 1024 * 1024 }); // 300MB
      
      const result = validateFileSize(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('250MB');
      expect(result.error).toContain('300.00MB');
    });
    
    it('should handle edge case at exact limit', () => {
      const file = new File(['content'], 'exact.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE }); // Exactly 250MB
      
      const result = validateFileSize(file);
      
      expect(result.valid).toBe(true);
    });
    
    it('should handle very small files', () => {
      const file = new File([''], 'empty.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 0 });
      
      const result = validateFileSize(file);
      
      expect(result.valid).toBe(true);
    });
  });
  
  describe('validateFileType', () => {
    it('should accept PDF files', () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      
      const result = validateFileType(file);
      
      expect(result.valid).toBe(true);
    });
    
    it('should accept JPEG files with different MIME types', () => {
      const files = [
        new File(['content'], 'image.jpg', { type: 'image/jpeg' }),
        new File(['content'], 'image.jpeg', { type: 'image/jpeg' })
      ];
      
      files.forEach(file => {
        const result = validateFileType(file);
        expect(result.valid).toBe(true);
      });
    });
    
    it('should accept PNG files', () => {
      const file = new File(['content'], 'image.png', { type: 'image/png' });
      
      const result = validateFileType(file);
      
      expect(result.valid).toBe(true);
    });
    
    it('should reject unsupported file types', () => {
      const unsupportedFiles = [
        new File(['content'], 'document.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
        new File(['content'], 'spreadsheet.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        new File(['content'], 'text.txt', { type: 'text/plain' }),
        new File(['content'], 'image.gif', { type: 'image/gif' }),
        new File(['content'], 'video.mp4', { type: 'video/mp4' })
      ];
      
      unsupportedFiles.forEach(file => {
        const result = validateFileType(file);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Only PDF, JPEG, and PNG files are allowed');
      });
    });
    
    it('should fallback to extension check when MIME type is missing', () => {
      const file = new File(['content'], 'document.pdf', { type: '' });
      
      const result = validateFileType(file);
      
      expect(result.valid).toBe(true);
    });
    
    it('should handle uppercase extensions', () => {
      const file = new File(['content'], 'IMAGE.PNG', { type: '' });
      
      const result = validateFileType(file);
      
      expect(result.valid).toBe(true);
    });
    
    it('should reject files with no extension and wrong MIME type', () => {
      const file = new File(['content'], 'noextension', { type: 'text/plain' });
      
      const result = validateFileType(file);
      
      expect(result.valid).toBe(false);
    });
  });
  
  describe('validateFileName', () => {
    it('should accept valid file names', () => {
      const validNames = [
        'document.pdf',
        'my-file.png',
        'report_2024.pdf',
        'image (1).jpg',
        'file.with.dots.pdf',
        '12345.png',
        'a'.repeat(255) // Max length
      ];
      
      validNames.forEach(name => {
        const result = validateFileName(name);
        expect(result.valid).toBe(true);
      });
    });
    
    it('should reject empty file names', () => {
      const emptyNames = ['', ' ', '   ', '\t', '\n'];
      
      emptyNames.forEach(name => {
        const result = validateFileName(name);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('empty');
      });
    });
    
    it('should reject file names with invalid characters', () => {
      const invalidNames = [
        'file<name>.pdf',
        'file>name.pdf',
        'file:name.pdf',
        'file"name.pdf',
        'file|name.pdf',
        'file?name.pdf',
        'file*name.pdf',
        'file\x00name.pdf',
        'file\x1fname.pdf'
      ];
      
      invalidNames.forEach(name => {
        const result = validateFileName(name);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });
    });
    
    it('should reject file names with path traversal attempts', () => {
      const pathTraversalNames = [
        '../file.pdf',
        '..\\file.pdf',
        'folder/../file.pdf',
        'folder/file.pdf',
        'folder\\file.pdf',
        '../../etc/passwd'
      ];
      
      pathTraversalNames.forEach(name => {
        const result = validateFileName(name);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('invalid path characters');
      });
    });
    
    it('should reject file names that are too long', () => {
      const longName = 'a'.repeat(256) + '.pdf';
      
      const result = validateFileName(longName);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });
  });
  
  describe('validateFile', () => {
    it('should accept valid files', () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(true);
    });
    
    it('should reject files with invalid names first', () => {
      const file = new File(['content'], '../evil.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 });
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid path characters');
    });
    
    it('should reject files with invalid type after name check', () => {
      const file = new File(['content'], 'document.exe', { type: 'application/x-msdownload' });
      Object.defineProperty(file, 'size', { value: 1024 });
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Only PDF, JPEG, and PNG files are allowed');
    });
    
    it('should reject files with invalid size after type check', () => {
      const file = new File(['content'], 'huge.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 300 * 1024 * 1024 });
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum limit');
    });
  });
  
  describe('getFileExtension', () => {
    it('should extract file extensions correctly', () => {
      expect(getFileExtension('document.pdf')).toBe('.pdf');
      expect(getFileExtension('image.jpeg')).toBe('.jpeg');
      expect(getFileExtension('file.with.dots.png')).toBe('.png');
      expect(getFileExtension('UPPERCASE.PDF')).toBe('.PDF');
    });
    
    it('should return empty string for files without extension', () => {
      expect(getFileExtension('noextension')).toBe('');
      expect(getFileExtension('')).toBe('');
    });
    
    it('should handle edge cases', () => {
      expect(getFileExtension('.')).toBe('.');
      expect(getFileExtension('.hidden')).toBe('.hidden');
      expect(getFileExtension('file.')).toBe('.');
    });
  });
  
  describe('estimatePageCount', () => {
    it('should return 1 for image files', () => {
      const imageFiles = [
        new File(['content'], 'image.jpg', { type: 'image/jpeg' }),
        new File(['content'], 'image.png', { type: 'image/png' }),
        new File(['content'], 'image.gif', { type: 'image/gif' })
      ];
      
      imageFiles.forEach(file => {
        expect(estimatePageCount(file)).toBe(1);
      });
    });
    
    it('should estimate PDF pages based on file size', () => {
      const testCases = [
        { size: 50 * 1024, expected: 1 },        // 50KB = ~1 page
        { size: 500 * 1024, expected: 5 },       // 500KB = ~5 pages
        { size: 1 * 1024 * 1024, expected: 11 }, // 1MB = ~11 pages
        { size: 5 * 1024 * 1024, expected: 52 }  // 5MB = ~52 pages, but capped at 50
      ];
      
      testCases.forEach(({ size, expected }) => {
        const file = new File([''], 'document.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'size', { value: size });
        
        const result = estimatePageCount(file);
        
        if (expected > MAX_FILE_PAGES) {
          expect(result).toBe(MAX_FILE_PAGES);
        } else {
          expect(result).toBe(expected);
        }
      });
    });
    
    it('should return 1 for unknown file types', () => {
      const file = new File(['content'], 'unknown.xyz', { type: 'application/octet-stream' });
      
      expect(estimatePageCount(file)).toBe(1);
    });
    
    it('should handle empty PDFs', () => {
      const file = new File([''], 'empty.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 0 });
      
      expect(estimatePageCount(file)).toBe(0);
    });
  });
  
  describe('validatePageCount', () => {
    it('should accept page counts within limit', () => {
      const validCounts = [1, 10, 25, 49, 50];
      
      validCounts.forEach(count => {
        const result = validatePageCount(count);
        expect(result.valid).toBe(true);
      });
    });
    
    it('should reject page counts exceeding limit', () => {
      const invalidCounts = [51, 100, 1000];
      
      invalidCounts.forEach(count => {
        const result = validatePageCount(count);
        expect(result.valid).toBe(false);
        expect(result.error).toContain(`${count}`);
        expect(result.error).toContain(`${MAX_FILE_PAGES}`);
      });
    });
    
    it('should handle edge cases', () => {
      expect(validatePageCount(0).valid).toBe(true);
      expect(validatePageCount(-1).valid).toBe(true); // Not checking for negative
      expect(validatePageCount(MAX_FILE_PAGES).valid).toBe(true);
      expect(validatePageCount(MAX_FILE_PAGES + 1).valid).toBe(false);
    });
  });
});