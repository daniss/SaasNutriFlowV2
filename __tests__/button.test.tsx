import { Button } from '@/components/ui/button'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Button Component', () => {
  it('renders button with text', () => {
    const { getByRole } = render(<Button>Click me</Button>)
    expect(getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    const { getByRole } = render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant classes correctly', () => {
    const { getByRole } = render(<Button variant="destructive">Delete</Button>)
    const button = getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('applies size classes correctly', () => {
    const { getByRole } = render(<Button size="sm">Small</Button>)
    const button = getByRole('button')
    expect(button).toHaveClass('h-9')
  })

  it('can be disabled', () => {
    const { getByRole } = render(<Button disabled>Disabled</Button>)
    const button = getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none')
  })

  it('renders loading state', () => {
    const { getByRole } = render(<Button disabled>Loading...</Button>)
    const button = getByRole('button')
    expect(button).toBeDisabled()
  })
})
