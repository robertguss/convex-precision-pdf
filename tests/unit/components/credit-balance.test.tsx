import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CreditBalance } from '@/app/dashboard/components/credit-balance'

/**
 * Mock the Convex query hook
 */
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}))

/**
 * Mock the UI components
 */
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => 
    <div data-testid="badge" data-variant={variant} className={className}>
      {children}
    </div>
}))

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => 
    <div data-testid="progress" data-value={value} className={className} />
}))

const { useQuery } = await import('convex/react') as any

describe('CreditBalance', () => {
  it('renders demo mode badge when isDemo is true', () => {
    render(<CreditBalance isDemo={true} />)
    
    expect(screen.getByTestId('badge')).toBeInTheDocument()
    expect(screen.getByText('Demo Mode')).toBeInTheDocument()
    expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'secondary')
  })

  it('renders loading state when pageUsage is null', () => {
    useQuery.mockReturnValue(null)
    
    render(<CreditBalance />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'secondary')
  })

  it('renders credit balance with normal state', () => {
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

  it('renders warning state when remaining pages are low', () => {
    const mockPageUsage = {
      remaining: 3,
      used: 97,
      limit: 100
    }
    useQuery.mockReturnValue(mockPageUsage)
    
    render(<CreditBalance />)
    
    expect(screen.getByText('3 pages')).toBeInTheDocument()
    expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'warning')
  })

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
  })

  it('handles edge case with zero limit', () => {
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
})