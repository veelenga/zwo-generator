import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { EmptyState } from './EmptyState'

const defaultProps = {
  onGenerate: vi.fn(),
  onFileImport: vi.fn(),
  isLoading: false,
  error: null,
  onClearError: vi.fn(),
}

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState {...defaultProps} />)
    expect(screen.getByText('Create Your Workout')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<EmptyState {...defaultProps} />)
    expect(
      screen.getByText(/Describe your workout in plain English/)
    ).toBeInTheDocument()
  })

  it('renders all example prompts', () => {
    render(<EmptyState {...defaultProps} />)
    expect(screen.getByText('30min Recovery')).toBeInTheDocument()
    expect(screen.getByText('1hr Endurance')).toBeInTheDocument()
    expect(screen.getByText('Sweet Spot')).toBeInTheDocument()
    expect(screen.getByText('VO2max Intervals')).toBeInTheDocument()
    expect(screen.getByText('Threshold')).toBeInTheDocument()
    expect(screen.getByText('Sprint Training')).toBeInTheDocument()
  })

  it('calls onGenerate with prompt when example is clicked', async () => {
    const handleGenerate = vi.fn()
    const user = userEvent.setup()

    render(<EmptyState {...defaultProps} onGenerate={handleGenerate} />)
    await user.click(screen.getByText('30min Recovery'))

    expect(handleGenerate).toHaveBeenCalledWith(
      '30 minute easy recovery ride, keep power below 60%'
    )
  })

  it('calls onGenerate with correct prompt for each example', async () => {
    const handleGenerate = vi.fn()
    const user = userEvent.setup()

    render(<EmptyState {...defaultProps} onGenerate={handleGenerate} />)
    await user.click(screen.getByText('VO2max Intervals'))

    expect(handleGenerate).toHaveBeenCalledWith(
      '45 minute VO2max workout with 5x3 minute intervals at 110-120%'
    )
  })

  it('renders lightning icon', () => {
    render(<EmptyState {...defaultProps} />)
    const icon = document.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('renders error message when error is provided', () => {
    render(<EmptyState {...defaultProps} error="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('calls onClearError when error close button is clicked', async () => {
    const handleClearError = vi.fn()
    const user = userEvent.setup()

    render(<EmptyState {...defaultProps} error="Test error" onClearError={handleClearError} />)
    const closeButton = screen.getByRole('button', { name: 'Close error' })
    await user.click(closeButton)

    expect(handleClearError).toHaveBeenCalled()
  })
})
