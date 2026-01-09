import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  indeterminate?: boolean;
  error?: string;
  animate?: boolean;
  labelClassName?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const variantClasses = {
  default: 'text-primary-600 focus:ring-primary-500',
  success: 'text-success-600 focus:ring-success-500',
  warning: 'text-warning-600 focus:ring-warning-500',
  danger: 'text-danger-600 focus:ring-danger-500',
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  description,
  size = 'md',
  variant = 'default',
  indeterminate = false,
  error,
  animate = true,
  labelClassName,
  className,
  disabled,
  checked,
  id,
  ...props
}, ref) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  const checkboxClasses = clsx(
    sizeClasses[size],
    variantClasses[variant],
    'bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-offset-2',
    'transition-colors duration-200',
    disabled && 'opacity-50 cursor-not-allowed',
    error && 'border-danger-300 text-danger-600 focus:ring-danger-500',
    className
  );

  const checkboxElement = animate ? (
    <motion.input
      ref={ref}
      type="checkbox"
      id={checkboxId}
      className="absolute opacity-0 w-0 h-0"
      disabled={disabled}
      checked={checked}
      {...({} as any)}
      {...props}
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
    />
  ) : (
    <input
      ref={ref}
      type="checkbox"
      id={checkboxId}
      className={checkboxClasses}
      disabled={disabled}
      checked={checked}
      {...props}
    />
  );

  // Handle indeterminate state
  React.useEffect(() => {
    if (ref && typeof ref === 'object' && ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [ref, indeterminate]);

  if (!label && !description) {
    return checkboxElement;
  }

  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        {checkboxElement}
      </div>
      {(label || description) && (
        <div className="ml-3 text-sm">
          {label && (
            <label
              htmlFor={checkboxId}
              className={clsx(
                'font-medium text-gray-700 cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed',
                error && 'text-danger-700',
                labelClassName
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={clsx(
              'text-gray-500',
              disabled && 'opacity-50',
              error && 'text-danger-600'
            )}>
              {description}
            </p>
          )}
          {error && (
            <p className="text-danger-600 text-sm mt-1">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;