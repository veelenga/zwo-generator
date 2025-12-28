import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState onExampleClick={vi.fn()} />)
    expect(screen.getByText('Create Your Workout')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<EmptyState onExampleClick={vi.fn()} />)
    expect(
      screen.getByText(/Describe your workout in plain English/)
    ).toBeInTheDocument()
  })

  it('renders all example prompts', () => {
    render(<EmptyState onExampleClick={vi.fn()} />)
    expect(screen.getByText('30min Recovery')).toBeInTheDocument()
    expect(screen.getByText('1hr Endurance')).toBeInTheDocument()
    expect(screen.getByText('Sweet Spot')).toBeInTheDocument()
    expect(screen.getByText('VO2max Intervals')).toBeInTheDocument()
    expect(screen.getByText('Threshold')).toBeInTheDocument()
    expect(screen.getByText('Sprint Training')).toBeInTheDocument()
  })

  it('calls onExampleClick with prompt when example is clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<EmptyState onExampleClick={handleClick} />)
    await user.click(screen.getByText('30min Recovery'))

    expect(handleClick).toHaveBeenCalledWith(
      '30 minute easy recovery ride, keep power below 60%'
    )
  })

  it('calls onExampleClick with correct prompt for each example', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<EmptyState onExampleClick={handleClick} />)
    await user.click(screen.getByText('VO2max Intervals'))

    expect(handleClick).toHaveBeenCalledWith(
      '45 minute VO2max workout with 5x3 minute intervals at 110-120%'
    )
  })

  it('renders lightning icon', () => {
    render(<EmptyState onExampleClick={vi.fn()} />)
    const icon = document.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })
})
