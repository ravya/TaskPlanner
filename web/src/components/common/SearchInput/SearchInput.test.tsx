import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/testUtils';
import SearchInput from './index';

describe('SearchInput Component', () => {
  it('should render search input', () => {
    render(<SearchInput placeholder="Search..." onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('should call onChange with debounced value', async () => {
    const handleChange = vi.fn();
    render(<SearchInput onChange={handleChange} debounceDelay={300} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test query' } });

    // Should not call immediately
    expect(handleChange).not.toHaveBeenCalled();

    // Should call after debounce time
    await waitFor(
      () => {
        expect(handleChange).toHaveBeenCalledWith('test query');
      },
      { timeout: 400 }
    );
  });

  it('should show search icon', () => {
    const { container } = render(<SearchInput onChange={vi.fn()} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should show clear button when value is present', () => {
    render(<SearchInput value="search term" onChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should clear value when clear button is clicked', () => {
    const handleChange = vi.fn();
    render(<SearchInput value="search term" onChange={handleChange} />);

    const buttons = screen.getAllByRole('button');
    const clearButton = buttons[0]; // First button is the clear button
    fireEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('should apply custom className', () => {
    const { container } = render(<SearchInput className="custom-class" onChange={vi.fn()} />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should handle controlled input', () => {
    const { rerender } = render(<SearchInput value="initial" onChange={vi.fn()} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    expect(input.value).toBe('initial');

    rerender(<SearchInput value="updated" onChange={vi.fn()} />);
    expect(input.value).toBe('updated');
  });

  it('should be accessible', () => {
    render(<SearchInput placeholder="Search tasks" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search tasks')).toBeInTheDocument();
  });
});
