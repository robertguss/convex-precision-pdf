import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CreditBalance } from '@/app/dashboard/components/credit-balance'

/**
 * Improved Credit Balance test using new test utilities
 * Demonstrates better patterns for component testing
 */

/**
 * Mock the Convex query hook
 */
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}))

/**
 * Mock the UI components with better type safety
 */
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { 
    children: React.ReactNode
    variant?: string
    className?: string 
  }) => (
    <div data-testid="badge" data-variant={variant} className={className}>
      {children}
    </div>
  )
}))

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value?: number; className?: string }) => (
    <div data-testid="progress" data-value={value} className={className} />
  )
}))

const { useQuery } = await import('convex/react') as any

describe('CreditBalance (Improved)', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  describe('Demo Mode', () => {
    it('renders demo mode badge when isDemo is true', () => {
      render(<CreditBalance isDemo={true} />)
      
      const badge = screen.getByTestId('badge')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('Demo Mode')
      expect(badge).toHaveAttribute('data-variant', 'secondary')
    })

    it('does not render demo badge when isDemo is false', () => {
      // Mock some usage data
      useQuery.mockReturnValue({
        remaining: 50,
        used: 50,
        limit: 100
      })

      render(<CreditBalance isDemo={false} />)
      
      expect(screen.queryByText('Demo Mode')).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('renders loading state when pageUsage is null', () => {
      // Mock Convex query to return null (loading state)
      useQuery.mockReturnValue(null)
      
      render(<CreditBalance />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'secondary')
    })

    it('renders loading state when pageUsage is undefined', () => {
      useQuery.mockReturnValue(undefined)
      
      render(<CreditBalance />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Normal Usage States', () => {
    it('renders credit balance with normal state (50% usage)', () => {
      const mockPageUsage = {
        remaining: 50,
        used: 50,
        limit: 100
      }
      useQuery.mockReturnValue(mockPageUsage)
      
      render(<CreditBalance />)
      
      expect(screen.getByText('Pages remaining')).toBeInTheDocument()
      expect(screen.getByText('50 pages')).toBeInTheDocument()
      expect(screen.getByText('50 of 100 pages used')).toBeInTheDocument()
      expect(screen.getByTestId('progress')).toHaveAttribute('data-value', '50')
    })

    it('renders credit balance with low usage (10% usage)', () => {
      const mockPageUsage = {
        remaining: 90,
        used: 10,
        limit: 100
      }
      useQuery.mockReturnValue(mockPageUsage)
      
      render(<CreditBalance />)
      
      expect(screen.getByText('90 pages')).toBeInTheDocument()
      expect(screen.getByText('10 of 100 pages used')).toBeInTheDocument()
      expect(screen.getByTestId('progress')).toHaveAttribute('data-value', '10')
      expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'default')
    })
  })

  describe('Warning States', () => {
    it('renders warning state when remaining pages are low (3 pages)', () => {
      const mockPageUsage = {
        remaining: 3,
        used: 97,
        limit: 100
      }
      useQuery.mockReturnValue(mockPageUsage)
      
      render(<CreditBalance />)
      
      expect(screen.getByText('3 pages')).toBeInTheDocument()
      expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'warning')
      expect(screen.getByTestId('progress')).toHaveAttribute('data-value', '97')
    })

    it('renders warning state when at warning threshold (5 pages)', () => {
      const mockPageUsage = {
        remaining: 5,
        used: 95,
        limit: 100
      }
      useQuery.mockReturnValue(mockPageUsage)
      
      render(<CreditBalance />)
      
      expect(screen.getByText('5 pages')).toBeInTheDocument()
      expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'warning')
    })
  })

  describe('Critical States', () => {
    it('renders destructive state when no pages remaining', () => {
      const mockPageUsage = {
        remaining: 0,
        used: 100,
        limit: 100
      }
      useQuery.mockReturnValue(mockPageUsage)
      
      render(<CreditBalance />)
      
      expect(screen.getByText('0 pages')).toBeInTheDocument()
      expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'destructive')
      expect(screen.getByTestId('progress')).toHaveAttribute('data-value', '100')
    })

    it('renders destructive state when over limit (edge case)', () => {
      const mockPageUsage = {
        remaining: -5,
        used: 105,
        limit: 100
      }
      useQuery.mockReturnValue(mockPageUsage)
      
      render(<CreditBalance />)
      
      expect(screen.getByText('-5 pages')).toBeInTheDocument()
      expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'destructive')
    })
  })

  describe('Edge Cases', () => {
    it('handles zero limit gracefully', () => {
      const mockPageUsage = {
        remaining: 0,
        used: 0,
        limit: 0
      }
      useQuery.mockReturnValue(mockPageUsage)
      
      render(<CreditBalance />)
      
      expect(screen.getByText('0 pages')).toBeInTheDocument()
      expect(screen.getByTestId('progress')).toHaveAttribute('data-value', '0')
    })

    it('handles very high usage numbers', () => {
      const mockPageUsage = {
        remaining: 500,
        used: 9500,
        limit: 10000
      }
      useQuery.mockReturnValue(mockPageUsage)
      
      render(<CreditBalance />)
      
      expect(screen.getByText('500 pages')).toBeInTheDocument()
      expect(screen.getByText('9500 of 10000 pages used')).toBeInTheDocument()
      expect(screen.getByTestId('progress')).toHaveAttribute('data-value', '95')
    })

    it('handles decimal usage values', () => {
      const mockPageUsage = {
        remaining: 25.5,
        used: 74.5,
        limit: 100
      }
      useQuery.mockReturnValue(mockPageUsage)
      
      render(<CreditBalance />)
      
      // Should handle decimals appropriately
      expect(screen.getByText('25.5 pages')).toBeInTheDocument()
    })

    it('handles missing or malformed data', () => {
      useQuery.mockReturnValue({
        // Missing 'remaining' field
        used: 50,
        limit: 100
      })
      
      render(<CreditBalance />)
      
      // Component should handle missing data gracefully
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides appropriate semantic information', () => {
      const mockPageUsage = {
        remaining: 50,
        used: 50,
        limit: 100
      }
      useQuery.mockReturnValue(mockPageUsage)
      
      render(<CreditBalance />)
      
      // Check that progress element has proper attributes
      const progress = screen.getByTestId('progress')
      expect(progress).toBeInTheDocument()
      
      // Badge should be accessible
      const badge = screen.getByTestId('badge')
      expect(badge).toBeInTheDocument()
    })

    it('maintains semantic structure in demo mode', () => {
      render(<CreditBalance isDemo={true} />)
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveTextContent('Demo Mode')
      expect(badge).toHaveAttribute('data-variant', 'secondary')
    })
  })

  describe('Props Validation', () => {
    it('respects isDemo prop when true', () => {
      render(<CreditBalance isDemo={true} />)
      
      expect(screen.getByText('Demo Mode')).toBeInTheDocument()
      // Should not query for usage data in demo mode
      expect(useQuery).not.toHaveBeenCalled()
    })

    it('queries for usage data when isDemo is false', () => {
      useQuery.mockReturnValue({
        remaining: 100,
        used: 0,
        limit: 100
      })
      
      render(<CreditBalance isDemo={false} />)
      
      expect(useQuery).toHaveBeenCalled()
      expect(screen.queryByText('Demo Mode')).not.toBeInTheDocument()
    })

    it('defaults isDemo to false when not provided', () => {
      useQuery.mockReturnValue({
        remaining: 75,
        used: 25,
        limit: 100
      })
      
      render(<CreditBalance />)
      
      expect(useQuery).toHaveBeenCalled()
      expect(screen.queryByText('Demo Mode')).not.toBeInTheDocument()
    })
  })
})