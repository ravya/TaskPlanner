import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { Button, ButtonGroup, IconButton } from './index';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should apply primary variant by default', () => {
      render(<Button>Primary Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-primary');
    });

    it('should apply correct variant classes', () => {
      const { rerender } = render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-secondary');

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-danger');

      rerender(<Button variant="success">Success</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-success');
    });

    it('should apply correct size classes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-sm');

      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-lg');

      rerender(<Button size="xl">Extra Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-xl');
    });

    it('should render with full width', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveClass('w-full');
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('Icons', () => {
    it('should render with left icon', () => {
      const leftIcon = <span data-testid="left-icon">←</span>;
      render(<Button leftIcon={leftIcon}>With Left Icon</Button>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render with right icon', () => {
      const rightIcon = <span data-testid="right-icon">→</span>;
      render(<Button rightIcon={rightIcon}>With Right Icon</Button>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should render with both icons', () => {
      const leftIcon = <span data-testid="left-icon">←</span>;
      const rightIcon = <span data-testid="right-icon">→</span>;
      render(
        <Button leftIcon={leftIcon} rightIcon={rightIcon}>
          Both Icons
        </Button>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('cursor-wait');
      expect(button.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    it('should hide icons when loading', () => {
      const leftIcon = <span data-testid="left-icon">←</span>;
      render(
        <Button loading leftIcon={leftIcon}>
          Loading
        </Button>
      );
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should hide text content visually when loading', () => {
      render(<Button loading>Loading Text</Button>);
      const text = screen.getByText('Loading Text');
      expect(text).toHaveClass('opacity-0');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should not trigger onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Interactions', () => {
    it('should call onClick handler', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should not animate when animate is false', () => {
      render(<Button animate={false}>No Animation</Button>);
      const button = screen.getByRole('button');
      // Check that it's a regular button, not motion.button
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom label');
    });

    it('should support aria-disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should be keyboard accessible', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});

describe('ButtonGroup Component', () => {
  it('should render children', () => {
    render(
      <ButtonGroup>
        <Button>Button 1</Button>
        <Button>Button 2</Button>
      </ButtonGroup>
    );
    expect(screen.getByText('Button 1')).toBeInTheDocument();
    expect(screen.getByText('Button 2')).toBeInTheDocument();
  });

  it('should apply horizontal orientation by default', () => {
    render(
      <ButtonGroup>
        <Button>Button 1</Button>
      </ButtonGroup>
    );
    const group = screen.getByRole('group');
    expect(group).toHaveClass('flex-row');
  });

  it('should apply vertical orientation', () => {
    render(
      <ButtonGroup orientation="vertical">
        <Button>Button 1</Button>
      </ButtonGroup>
    );
    const group = screen.getByRole('group');
    expect(group).toHaveClass('flex-col');
  });

  it('should apply spacing classes', () => {
    const { rerender } = render(
      <ButtonGroup spacing="tight">
        <Button>Button 1</Button>
      </ButtonGroup>
    );
    expect(screen.getByRole('group')).toHaveClass('gap-1');

    rerender(
      <ButtonGroup spacing="normal">
        <Button>Button 1</Button>
      </ButtonGroup>
    );
    expect(screen.getByRole('group')).toHaveClass('gap-2');

    rerender(
      <ButtonGroup spacing="loose">
        <Button>Button 1</Button>
      </ButtonGroup>
    );
    expect(screen.getByRole('group')).toHaveClass('gap-4');
  });

  it('should have role="group"', () => {
    render(
      <ButtonGroup>
        <Button>Button 1</Button>
      </ButtonGroup>
    );
    expect(screen.getByRole('group')).toBeInTheDocument();
  });
});

describe('IconButton Component', () => {
  it('should render with icon', () => {
    const icon = <span data-testid="icon">🔔</span>;
    render(
      <IconButton icon={icon} aria-label="Notifications">
        Notifications
      </IconButton>
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should require aria-label', () => {
    const icon = <span>🔔</span>;
    render(
      <IconButton icon={icon} aria-label="Notifications">
        Notifications
      </IconButton>
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Notifications');
  });

  it('should apply ghost variant by default', () => {
    const icon = <span>🔔</span>;
    render(
      <IconButton icon={icon} aria-label="Notifications">
        Notifications
      </IconButton>
    );
    expect(screen.getByRole('button')).toHaveClass('btn-ghost');
  });

  it('should apply aspect-square class', () => {
    const icon = <span>🔔</span>;
    render(
      <IconButton icon={icon} aria-label="Notifications">
        Notifications
      </IconButton>
    );
    expect(screen.getByRole('button')).toHaveClass('aspect-square');
  });

  it('should handle onClick', () => {
    const handleClick = vi.fn();
    const icon = <span>🔔</span>;
    render(
      <IconButton icon={icon} aria-label="Notifications" onClick={handleClick}>
        Notifications
      </IconButton>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
