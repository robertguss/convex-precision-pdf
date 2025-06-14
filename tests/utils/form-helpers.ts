import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

/**
 * Form and file upload utilities for testing user interactions
 * Provides comprehensive helpers for form testing, file uploads, and user events
 */

/**
 * User interaction utilities
 */
export const userInteractionUtils = {
  /**
   * Setup user event with realistic delays
   */
  setupUser: (options?: { delay?: number }) => {
    return userEvent.setup({
      delay: options?.delay || null, // null for no delay in tests
      pointerEventsCheck: 0, // Disable pointer events check for faster tests
      advanceTimers: vi.advanceTimersByTime
    })
  },

  /**
   * Type into an input field
   */
  typeIntoField: async (
    fieldName: string | HTMLElement, 
    value: string, 
    options?: { clear?: boolean; delay?: number }
  ) => {
    const user = userInteractionUtils.setupUser({ delay: options?.delay })
    const field = typeof fieldName === 'string' 
      ? screen.getByLabelText(fieldName) || screen.getByPlaceholderText(fieldName) || screen.getByRole('textbox', { name: fieldName })
      : fieldName

    if (options?.clear) {
      await user.clear(field)
    }
    await user.type(field, value)
    return field
  },

  /**
   * Click on an element
   */
  clickElement: async (
    element: string | HTMLElement,
    options?: { delay?: number }
  ) => {
    const user = userInteractionUtils.setupUser({ delay: options?.delay })
    const target = typeof element === 'string' 
      ? screen.getByRole('button', { name: element }) || screen.getByText(element)
      : element

    await user.click(target)
    return target
  },

  /**
   * Select an option from a dropdown
   */
  selectOption: async (
    selectElement: string | HTMLElement,
    optionValue: string,
    options?: { delay?: number }
  ) => {
    const user = userInteractionUtils.setupUser({ delay: options?.delay })
    const select = typeof selectElement === 'string'
      ? screen.getByLabelText(selectElement) || screen.getByDisplayValue(selectElement)
      : selectElement

    await user.selectOptions(select, optionValue)
    return select
  },

  /**
   * Check or uncheck a checkbox
   */
  toggleCheckbox: async (
    checkboxName: string | HTMLElement,
    checked: boolean,
    options?: { delay?: number }
  ) => {
    const user = userInteractionUtils.setupUser({ delay: options?.delay })
    const checkbox = typeof checkboxName === 'string'
      ? screen.getByLabelText(checkboxName) || screen.getByRole('checkbox', { name: checkboxName })
      : checkboxName

    if (checked) {
      await user.check(checkbox)
    } else {
      await user.uncheck(checkbox)
    }
    return checkbox
  },

  /**
   * Press a key or key combination
   */
  pressKey: async (
    key: string,
    options?: { delay?: number }
  ) => {
    const user = userInteractionUtils.setupUser({ delay: options?.delay })
    await user.keyboard(key)
  },

  /**
   * Tab to next/previous element
   */
  tabToNext: async (options?: { shift?: boolean; delay?: number }) => {
    const user = userInteractionUtils.setupUser({ delay: options?.delay })
    await user.tab({ shift: options?.shift })
  },

  /**
   * Hover over an element
   */
  hoverElement: async (
    element: string | HTMLElement,
    options?: { delay?: number }
  ) => {
    const user = userInteractionUtils.setupUser({ delay: options?.delay })
    const target = typeof element === 'string'
      ? screen.getByText(element) || screen.getByRole('button', { name: element })
      : element

    await user.hover(target)
    return target
  },

  /**
   * Unhover an element
   */
  unhoverElement: async (
    element: string | HTMLElement,
    options?: { delay?: number }
  ) => {
    const user = userInteractionUtils.setupUser({ delay: options?.delay })
    const target = typeof element === 'string'
      ? screen.getByText(element) || screen.getByRole('button', { name: element })
      : element

    await user.unhover(target)
    return target
  }
}

/**
 * Form utilities for testing form interactions
 */
export const formUtils = {
  /**
   * Fill out a complete form
   */
  fillForm: async (formData: Record<string, string | boolean | string[]>) => {
    const user = userInteractionUtils.setupUser()

    for (const [fieldName, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        await userInteractionUtils.typeIntoField(fieldName, value)
      } else if (typeof value === 'boolean') {
        await userInteractionUtils.toggleCheckbox(fieldName, value)
      } else if (Array.isArray(value)) {
        // Handle multi-select
        for (const option of value) {
          await userInteractionUtils.selectOption(fieldName, option)
        }
      }
    }
  },

  /**
   * Submit a form
   */
  submitForm: async (formName?: string) => {
    const user = userInteractionUtils.setupUser()
    const form = formName 
      ? screen.getByRole('form', { name: formName })
      : screen.getByRole('form') || document.querySelector('form')

    if (form) {
      const submitButton = form.querySelector('button[type="submit"]') || 
                          form.querySelector('input[type="submit"]') ||
                          screen.getByRole('button', { name: /submit/i })
      
      if (submitButton) {
        await user.click(submitButton)
      } else {
        fireEvent.submit(form)
      }
    }
  },

  /**
   * Reset a form
   */
  resetForm: async (formName?: string) => {
    const form = formName 
      ? screen.getByRole('form', { name: formName })
      : screen.getByRole('form') || document.querySelector('form')

    if (form) {
      const resetButton = form.querySelector('button[type="reset"]') || 
                         form.querySelector('input[type="reset"]')
      
      if (resetButton) {
        await userInteractionUtils.clickElement(resetButton)
      } else {
        fireEvent.reset(form)
      }
    }
  },

  /**
   * Validate form fields
   */
  validateForm: async (expectedErrors: Record<string, string>) => {
    await waitFor(() => {
      for (const [fieldName, expectedError] of Object.entries(expectedErrors)) {
        const errorElement = screen.getByText(expectedError) || 
                            screen.getByLabelText(fieldName)?.getAttribute('aria-describedby')
        expect(errorElement).toBeInTheDocument()
      }
    })
  },

  /**
   * Check if form is valid
   */
  isFormValid: async (formName?: string): Promise<boolean> => {
    const form = formName 
      ? screen.getByRole('form', { name: formName })
      : screen.getByRole('form') || document.querySelector('form')

    if (form && form instanceof HTMLFormElement) {
      return form.checkValidity()
    }
    return false
  },

  /**
   * Get form data
   */
  getFormData: (formName?: string): FormData | null => {
    const form = formName 
      ? screen.getByRole('form', { name: formName })
      : screen.getByRole('form') || document.querySelector('form')

    if (form && form instanceof HTMLFormElement) {
      return new FormData(form)
    }
    return null
  }
}

/**
 * File upload utilities for testing file operations
 */
export const fileUploadUtils = {
  /**
   * Create a mock file for testing
   */
  createMockFile: (
    name: string = 'test-file.pdf',
    content: string = 'test content',
    options?: {
      type?: string
      size?: number
      lastModified?: number
    }
  ): File => {
    const { type = 'application/pdf', size, lastModified = Date.now() } = options || {}
    
    const file = new File([content], name, { type, lastModified })
    
    // Override size if specified
    if (size !== undefined) {
      Object.defineProperty(file, 'size', {
        value: size,
        writable: false
      })
    }
    
    return file
  },

  /**
   * Create multiple mock files
   */
  createMockFiles: (
    files: Array<{
      name: string
      content?: string
      type?: string
      size?: number
    }>
  ): File[] => {
    return files.map(file => 
      fileUploadUtils.createMockFile(
        file.name,
        file.content,
        { type: file.type, size: file.size }
      )
    )
  },

  /**
   * Simulate file upload via input
   */
  uploadFiles: async (
    inputElement: string | HTMLElement,
    files: File[]
  ) => {
    const user = userInteractionUtils.setupUser()
    const input = typeof inputElement === 'string'
      ? screen.getByLabelText(inputElement) || screen.getByTestId(inputElement)
      : inputElement

    await user.upload(input, files)
    return input
  },

  /**
   * Simulate drag and drop file upload
   */
  dragAndDropFiles: async (
    dropZone: string | HTMLElement,
    files: File[]
  ) => {
    const target = typeof dropZone === 'string'
      ? screen.getByTestId(dropZone) || screen.getByText(dropZone)
      : dropZone

    // Simulate drag enter
    fireEvent.dragEnter(target, {
      dataTransfer: {
        files,
        items: files.map(file => ({ kind: 'file', type: file.type, getAsFile: () => file })),
        types: ['Files']
      }
    })

    // Simulate drag over
    fireEvent.dragOver(target, {
      dataTransfer: {
        files,
        items: files.map(file => ({ kind: 'file', type: file.type, getAsFile: () => file })),
        types: ['Files']
      }
    })

    // Simulate drop
    fireEvent.drop(target, {
      dataTransfer: {
        files,
        items: files.map(file => ({ kind: 'file', type: file.type, getAsFile: () => file })),
        types: ['Files']
      }
    })

    return target
  },

  /**
   * Simulate paste files
   */
  pasteFiles: async (
    target: string | HTMLElement,
    files: File[]
  ) => {
    const element = typeof target === 'string'
      ? screen.getByTestId(target) || screen.getByText(target)
      : target

    fireEvent.paste(element, {
      clipboardData: {
        files,
        items: files.map(file => ({ kind: 'file', type: file.type, getAsFile: () => file })),
        types: ['Files']
      }
    })

    return element
  },

  /**
   * Common file types for testing
   */
  commonFiles: {
    pdf: (name: string = 'test.pdf') => 
      fileUploadUtils.createMockFile(name, 'PDF content', { type: 'application/pdf' }),
    
    image: (name: string = 'test.jpg') => 
      fileUploadUtils.createMockFile(name, 'Image content', { type: 'image/jpeg' }),
    
    doc: (name: string = 'test.docx') => 
      fileUploadUtils.createMockFile(name, 'Document content', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      }),
    
    text: (name: string = 'test.txt') => 
      fileUploadUtils.createMockFile(name, 'Text content', { type: 'text/plain' }),
    
    csv: (name: string = 'test.csv') => 
      fileUploadUtils.createMockFile(name, 'CSV content', { type: 'text/csv' }),
    
    excel: (name: string = 'test.xlsx') => 
      fileUploadUtils.createMockFile(name, 'Excel content', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      }),
    
    largeFile: (name: string = 'large.pdf', sizeMB: number = 10) => 
      fileUploadUtils.createMockFile(name, 'Large file content', { 
        type: 'application/pdf',
        size: sizeMB * 1024 * 1024 
      }),
    
    invalidFile: (name: string = 'invalid.exe') => 
      fileUploadUtils.createMockFile(name, 'Invalid content', { type: 'application/exe' })
  },

  /**
   * File validation utilities
   */
  validation: {
    /**
     * Check file size
     */
    isFileSizeValid: (file: File, maxSizeMB: number): boolean => {
      return file.size <= maxSizeMB * 1024 * 1024
    },

    /**
     * Check file type
     */
    isFileTypeValid: (file: File, allowedTypes: string[]): boolean => {
      return allowedTypes.includes(file.type)
    },

    /**
     * Check file extension
     */
    isFileExtensionValid: (file: File, allowedExtensions: string[]): boolean => {
      const extension = file.name.split('.').pop()?.toLowerCase()
      return allowedExtensions.includes(extension || '')
    },

    /**
     * Validate multiple files
     */
    validateFiles: (
      files: File[],
      rules: {
        maxSize?: number
        allowedTypes?: string[]
        allowedExtensions?: string[]
        maxCount?: number
      }
    ): { valid: boolean; errors: string[] } => {
      const errors: string[] = []

      if (rules.maxCount && files.length > rules.maxCount) {
        errors.push(`Too many files. Maximum ${rules.maxCount} allowed.`)
      }

      files.forEach((file, index) => {
        if (rules.maxSize && !fileUploadUtils.validation.isFileSizeValid(file, rules.maxSize)) {
          errors.push(`File ${index + 1}: Size exceeds ${rules.maxSize}MB limit`)
        }

        if (rules.allowedTypes && !fileUploadUtils.validation.isFileTypeValid(file, rules.allowedTypes)) {
          errors.push(`File ${index + 1}: Invalid file type`)
        }

        if (rules.allowedExtensions && !fileUploadUtils.validation.isFileExtensionValid(file, rules.allowedExtensions)) {
          errors.push(`File ${index + 1}: Invalid file extension`)
        }
      })

      return { valid: errors.length === 0, errors }
    }
  }
}

/**
 * Mock upload progress for testing
 */
export const uploadProgressUtils = {
  /**
   * Create a mock upload progress handler
   */
  createMockUploadProgress: (
    duration: number = 2000,
    steps: number = 10
  ) => {
    const progressCallbacks: Array<(progress: number) => void> = []
    let currentProgress = 0

    const simulateProgress = () => {
      const interval = duration / steps
      const progressStep = 100 / steps

      const timer = setInterval(() => {
        currentProgress += progressStep
        
        if (currentProgress >= 100) {
          currentProgress = 100
          clearInterval(timer)
        }

        progressCallbacks.forEach(callback => callback(currentProgress))
      }, interval)

      return timer
    }

    return {
      onProgress: (callback: (progress: number) => void) => {
        progressCallbacks.push(callback)
      },
      start: simulateProgress,
      getCurrentProgress: () => currentProgress
    }
  },

  /**
   * Mock upload states
   */
  uploadStates: {
    idle: { status: 'idle', progress: 0 },
    uploading: (progress: number) => ({ status: 'uploading', progress }),
    processing: { status: 'processing', progress: 100 },
    completed: { status: 'completed', progress: 100 },
    error: (message: string) => ({ status: 'error', progress: 0, error: message })
  }
}

/**
 * Form validation utilities
 */
export const validationUtils = {
  /**
   * Common validation patterns
   */
  patterns: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s\-\(\)]+$/,
    url: /^https?:\/\/.+/,
    strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  },

  /**
   * Validate email
   */
  isValidEmail: (email: string): boolean => {
    return validationUtils.patterns.email.test(email)
  },

  /**
   * Validate required fields
   */
  validateRequired: (fields: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    Object.entries(fields).forEach(([key, value]) => {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[key] = `${key} is required`
      }
    })

    return errors
  },

  /**
   * Validate field lengths
   */
  validateLengths: (
    fields: Record<string, string>,
    rules: Record<string, { min?: number; max?: number }>
  ): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    Object.entries(fields).forEach(([key, value]) => {
      const rule = rules[key]
      if (rule) {
        if (rule.min && value.length < rule.min) {
          errors[key] = `${key} must be at least ${rule.min} characters`
        }
        if (rule.max && value.length > rule.max) {
          errors[key] = `${key} must be no more than ${rule.max} characters`
        }
      }
    })

    return errors
  }
}

/**
 * Accessibility testing utilities
 */
export const a11yUtils = {
  /**
   * Check if element has proper ARIA labels
   */
  hasAriaLabel: (element: HTMLElement): boolean => {
    return !!(element.getAttribute('aria-label') || 
              element.getAttribute('aria-labelledby') ||
              element.getAttribute('aria-describedby'))
  },

  /**
   * Check if form has proper labels
   */
  hasProperLabels: (form: HTMLFormElement): boolean => {
    const inputs = form.querySelectorAll('input, select, textarea')
    return Array.from(inputs).every(input => {
      const id = input.getAttribute('id')
      return id && form.querySelector(`label[for="${id}"]`)
    })
  },

  /**
   * Check keyboard navigation
   */
  isKeyboardNavigable: (element: HTMLElement): boolean => {
    const tabIndex = element.getAttribute('tabindex')
    return element.tagName === 'BUTTON' || 
           element.tagName === 'INPUT' ||
           element.tagName === 'SELECT' ||
           element.tagName === 'TEXTAREA' ||
           element.tagName === 'A' ||
           (tabIndex !== null && parseInt(tabIndex) >= 0)
  }
}