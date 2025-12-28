import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { Select } from './Select'

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
]

describe('Select', () => {
  it('renders select element', () => {
    render(<Select options={mockOptions} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders all options', () => {
    render(<Select options={mockOptions} />)
    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    render(<Select label="Category" options={mockOptions} />)
    expect(screen.getByText('Category')).toBeInTheDocument()
  })

  it('associates label with select', () => {
    render(<Select label="Category" options={mockOptions} />)
    const select = screen.getByRole('combobox')
    expect(select).toHaveAttribute('id', 'category')
  })

  it('uses custom id when provided', () => {
    render(<Select label="Category" id="custom-id" options={mockOptions} />)
    const select = screen.getByRole('combobox')
    expect(select).toHaveAttribute('id', 'custom-id')
  })

  it('displays error message when provided', () => {
    render(<Select error="Please select an option" options={mockOptions} />)
    expect(screen.getByText('Please select an option')).toBeInTheDocument()
  })

  it('applies error styles when error is present', () => {
    render(<Select error="Error" options={mockOptions} />)
    expect(screen.getByRole('combobox')).toHaveClass('border-red-500')
  })

  it('handles value changes', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(<Select onChange={handleChange} options={mockOptions} />)
    await user.selectOptions(screen.getByRole('combobox'), 'option2')

    expect(handleChange).toHaveBeenCalled()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Select disabled options={mockOptions} />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Select ref={ref} options={mockOptions} />)
    expect(ref).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Select className="custom-class" options={mockOptions} />)
    expect(screen.getByRole('combobox')).toHaveClass('custom-class')
  })

  it('sets correct value attribute for each option', () => {
    render(<Select options={mockOptions} />)
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveValue('option1')
    expect(options[1]).toHaveValue('option2')
    expect(options[2]).toHaveValue('option3')
  })

  it('selects correct option based on value prop', () => {
    render(<Select options={mockOptions} value="option2" onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toHaveValue('option2')
  })
})
