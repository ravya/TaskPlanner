import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { Input, Textarea, PasswordInput, InputGroup } from './index';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input field', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Username" placeholder="Enter username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('should render with hint text', () => {
      render(<Input hint="Enter at least 3 characters" />);
      expect(screen.getByText('Enter at least 3 characters')).toBeInTheDocument();
    });

    it('should render with error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should hide hint when error is present', () => {
      render(<Input hint="This is a hint" error="This is an error" />);
      expect(screen.queryByText('This is a hint')).not.toBeInTheDocument();
      expect(screen.getByText('This is an error')).toBeInTheDocument();
    });

    it('should show required indicator on label', () => {
      render(<Input label="Email" required />);
      const label = screen.getByText('Email').closest('label');
      expect(label).toHaveClass("after:content-['*']");
    });
  });

  describe('Variants and Sizes', () => {
    it('should apply default variant by default', () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('form-input');
    });

    it('should apply error variant when error prop is present', () => {
      render(<Input data-testid="input" error="Error message" />);
      expect(screen.getByTestId('input')).toHaveClass('border-danger-300');
    });

    it('should apply success variant', () => {
      render(<Input data-testid="input" variant="success" />);
      expect(screen.getByTestId('input')).toHaveClass('border-success-300');
    });

    it('should apply warning variant', () => {
      render(<Input data-testid="input" variant="warning" />);
      expect(screen.getByTestId('input')).toHaveClass('border-warning-300');
    });

    it('should apply size classes', () => {
      const { rerender } = render(<Input data-testid="input" size="sm" />);
      expect(screen.getByTestId('input')).toHaveClass('px-3', 'py-1.5');

      rerender(<Input data-testid="input" size="md" />);
      expect(screen.getByTestId('input')).toHaveClass('px-3', 'py-2');

      rerender(<Input data-testid="input" size="lg" />);
      expect(screen.getByTestId('input')).toHaveClass('px-4', 'py-3');
    });

    it('should apply full width by default', () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('w-full');
    });

    it('should not apply full width when fullWidth is false', () => {
      render(<Input data-testid="input" fullWidth={false} />);
      expect(screen.getByTestId('input')).not.toHaveClass('w-full');
    });
  });

  describe('Icons and Elements', () => {
    it('should render with left icon', () => {
      const icon = <span data-testid="left-icon">🔍</span>;
      render(<Input leftIcon={icon} data-testid="input" />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('input')).toHaveClass('pl-10');
    });

    it('should render with right icon', () => {
      const icon = <span data-testid="right-icon">✓</span>;
      render(<Input rightIcon={icon} data-testid="input" />);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByTestId('input')).toHaveClass('pr-10');
    });

    it('should render with both left and right icons', () => {
      const leftIcon = <span data-testid="left-icon">🔍</span>;
      const rightIcon = <span data-testid="right-icon">✓</span>;
      render(<Input leftIcon={leftIcon} rightIcon={rightIcon} data-testid="input" />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should render with left element', () => {
      const element = <button data-testid="left-element">Click</button>;
      render(<Input leftElement={element} data-testid="input" />);
      expect(screen.getByTestId('left-element')).toBeInTheDocument();
    });

    it('should render with right element', () => {
      const element = <button data-testid="right-element">Clear</button>;
      render(<Input rightElement={element} data-testid="input" />);
      expect(screen.getByTestId('right-element')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled data-testid="input" />);
      expect(screen.getByTestId('input')).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      render(<Input disabled data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should apply disabled styles to label', () => {
      render(<Input label="Disabled" disabled />);
      const label = screen.getByText('Disabled').closest('label');
      expect(label).toHaveClass('opacity-50');
    });
  });

  describe('Interactions', () => {
    it('should call onChange handler', () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} data-testid="input" />);
      fireEvent.change(screen.getByTestId('input'), { target: { value: 'test' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('should call onFocus handler', () => {
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} data-testid="input" />);
      fireEvent.focus(screen.getByTestId('input'));
      expect(handleFocus).toHaveBeenCalled();
    });

    it('should call onBlur handler', () => {
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} data-testid="input" />);
      const input = screen.getByTestId('input');
      fireEvent.focus(input);
      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalled();
    });

    it('should update value', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'new value' } });
      expect(input.value).toBe('new value');
    });
  });

  describe('Accessibility', () => {
    it('should associate label with input', () => {
      render(<Input label="Username" id="username" />);
      const input = screen.getByLabelText('Username');
      expect(input).toHaveAttribute('id', 'username');
    });

    it('should generate unique ID if not provided', () => {
      render(<Input label="Test" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('id');
      expect(input.getAttribute('id')).toMatch(/^input-/);
    });

    it('should support required attribute', () => {
      render(<Input required data-testid="input" />);
      expect(screen.getByTestId('input')).toBeRequired();
    });
  });
});

describe('Textarea Component', () => {
  it('should render textarea', () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<Textarea label="Description" />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('should apply resize class', () => {
    const { rerender } = render(<Textarea data-testid="textarea" resize="none" />);
    expect(screen.getByTestId('textarea')).toHaveClass('resize-none');

    rerender(<Textarea data-testid="textarea" resize="vertical" />);
    expect(screen.getByTestId('textarea')).toHaveClass('resize-y');

    rerender(<Textarea data-testid="textarea" resize="horizontal" />);
    expect(screen.getByTestId('textarea')).toHaveClass('resize-x');

    rerender(<Textarea data-testid="textarea" resize="both" />);
    expect(screen.getByTestId('textarea')).toHaveClass('resize');
  });

  it('should set default rows', () => {
    render(<Textarea data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '3');
  });

  it('should apply custom rows', () => {
    render(<Textarea rows={5} data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '5');
  });

  it('should show error message', () => {
    render(<Textarea error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should call onChange', () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} data-testid="textarea" />);
    fireEvent.change(screen.getByTestId('textarea'), { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });
});

describe('PasswordInput Component', () => {
  it('should render password input', () => {
    render(<PasswordInput data-testid="password" />);
    expect(screen.getByTestId('password')).toHaveAttribute('type', 'password');
  });

  it('should render toggle button by default', () => {
    render(<PasswordInput />);
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
  });

  it('should toggle password visibility', () => {
    render(<PasswordInput data-testid="password" />);
    const input = screen.getByTestId('password') as HTMLInputElement;
    const toggleButton = screen.getByRole('button');

    expect(input.type).toBe('password');

    fireEvent.click(toggleButton);
    expect(input.type).toBe('text');

    fireEvent.click(toggleButton);
    expect(input.type).toBe('password');
  });

  it('should not show toggle when showToggle is false', () => {
    render(<PasswordInput showToggle={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<PasswordInput label="Password" />);
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should show error message', () => {
    render(<PasswordInput error="Password is required" />);
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });
});

describe('InputGroup Component', () => {
  it('should render children', () => {
    render(
      <InputGroup>
        <Input placeholder="Test" />
        <button>Submit</button>
      </InputGroup>
    );
    expect(screen.getByPlaceholderText('Test')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should apply flex class', () => {
    const { container } = render(
      <InputGroup>
        <Input />
      </InputGroup>
    );
    expect(container.firstChild).toHaveClass('flex');
  });

  it('should apply size attribute', () => {
    const { container } = render(
      <InputGroup size="lg">
        <Input />
      </InputGroup>
    );
    expect(container.firstChild).toHaveAttribute('data-size', 'lg');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <InputGroup className="custom-class">
        <Input />
      </InputGroup>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
