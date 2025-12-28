import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/test-utils'
import { Slider } from './Slider'

describe('Slider', () => {
  it('renders range input', () => {
    render(<Slider value={50} onChange={vi.fn()} />)
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    render(<Slider label="Volume" value={50} onChange={vi.fn()} />)
    expect(screen.getByText('Volume')).toBeInTheDocument()
  })

  it('associates label with input', () => {
    render(<Slider label="Volume" value={50} onChange={vi.fn()} />)
    const input = screen.getByRole('slider')
    expect(input).toHaveAttribute('id', 'volume')
  })

  it('uses custom id when provided', () => {
    render(<Slider label="Volume" id="custom-id" value={50} onChange={vi.fn()} />)
    const input = screen.getByRole('slider')
    expect(input).toHaveAttribute('id', 'custom-id')
  })

  it('shows value by default', () => {
    render(<Slider value={50} onChange={vi.fn()} />)
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('hides value when showValue is false', () => {
    render(<Slider value={50} showValue={false} onChange={vi.fn()} />)
    expect(screen.queryByText('50')).not.toBeInTheDocument()
  })

  it('formats value when formatValue is provided', () => {
    const formatValue = (value: number) => `${value}%`
    render(<Slider value={50} formatValue={formatValue} onChange={vi.fn()} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('accepts min and max props', () => {
    render(<Slider value={50} min={0} max={100} onChange={vi.fn()} />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('min', '0')
    expect(slider).toHaveAttribute('max', '100')
  })

  it('accepts step prop', () => {
    render(<Slider value={50} step={5} onChange={vi.fn()} />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('step', '5')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Slider ref={ref} value={50} onChange={vi.fn()} />)
    expect(ref).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Slider className="custom-class" value={50} onChange={vi.fn()} />)
    expect(screen.getByRole('slider')).toHaveClass('custom-class')
  })

  it('shows both label and value when both are configured', () => {
    render(<Slider label="Power" value={75} onChange={vi.fn()} />)
    expect(screen.getByText('Power')).toBeInTheDocument()
    expect(screen.getByText('75')).toBeInTheDocument()
  })

  it('displays correct value in slider', () => {
    render(<Slider value={75} onChange={vi.fn()} />)
    expect(screen.getByRole('slider')).toHaveValue('75')
  })
})
