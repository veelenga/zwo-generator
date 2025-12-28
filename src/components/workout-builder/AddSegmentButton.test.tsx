import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { AddSegmentButton } from './AddSegmentButton'

describe('AddSegmentButton', () => {
  it('renders the add segment button', () => {
    render(<AddSegmentButton onAddSegment={vi.fn()} />)
    expect(screen.getByText('Add Segment')).toBeInTheDocument()
  })

  it('shows segment options when clicked', async () => {
    const user = userEvent.setup()
    render(<AddSegmentButton onAddSegment={vi.fn()} />)

    await user.click(screen.getByText('Add Segment'))

    expect(screen.getByText('Warm Up')).toBeInTheDocument()
    expect(screen.getByText('Steady State')).toBeInTheDocument()
    expect(screen.getByText('Intervals')).toBeInTheDocument()
    expect(screen.getByText('Ramp')).toBeInTheDocument()
    expect(screen.getByText('Free Ride')).toBeInTheDocument()
    expect(screen.getByText('Max Effort')).toBeInTheDocument()
    expect(screen.getByText('Cool Down')).toBeInTheDocument()
  })

  it('shows segment descriptions', async () => {
    const user = userEvent.setup()
    render(<AddSegmentButton onAddSegment={vi.fn()} />)

    await user.click(screen.getByText('Add Segment'))

    expect(screen.getByText('Gradual power increase')).toBeInTheDocument()
    expect(screen.getByText('Constant power')).toBeInTheDocument()
    expect(screen.getByText('Repeated on/off efforts')).toBeInTheDocument()
  })

  it('calls onAddSegment with correct type when option is selected', async () => {
    const handleAdd = vi.fn()
    const user = userEvent.setup()

    render(<AddSegmentButton onAddSegment={handleAdd} />)
    await user.click(screen.getByText('Add Segment'))
    await user.click(screen.getByText('Intervals'))

    expect(handleAdd).toHaveBeenCalledWith('intervals')
  })

  it('closes menu after selecting an option', async () => {
    const user = userEvent.setup()
    render(<AddSegmentButton onAddSegment={vi.fn()} />)

    await user.click(screen.getByText('Add Segment'))
    expect(screen.getByText('Warm Up')).toBeInTheDocument()

    await user.click(screen.getByText('Warm Up'))
    expect(screen.queryByText('Gradual power increase')).not.toBeInTheDocument()
  })

  it('toggles menu when clicking add button again', async () => {
    const user = userEvent.setup()
    render(<AddSegmentButton onAddSegment={vi.fn()} />)

    await user.click(screen.getByText('Add Segment'))
    expect(screen.getByText('Warm Up')).toBeInTheDocument()

    await user.click(screen.getByText('Add Segment'))
    expect(screen.queryByText('Gradual power increase')).not.toBeInTheDocument()
  })

  it('calls onAddSegment with warmup type', async () => {
    const handleAdd = vi.fn()
    const user = userEvent.setup()

    render(<AddSegmentButton onAddSegment={handleAdd} />)
    await user.click(screen.getByText('Add Segment'))
    await user.click(screen.getByText('Warm Up'))

    expect(handleAdd).toHaveBeenCalledWith('warmup')
  })

  it('calls onAddSegment with cooldown type', async () => {
    const handleAdd = vi.fn()
    const user = userEvent.setup()

    render(<AddSegmentButton onAddSegment={handleAdd} />)
    await user.click(screen.getByText('Add Segment'))
    await user.click(screen.getByText('Cool Down'))

    expect(handleAdd).toHaveBeenCalledWith('cooldown')
  })
})
