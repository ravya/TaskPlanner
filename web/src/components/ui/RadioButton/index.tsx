import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export interface RadioOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioButtonProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  error?: string;
  animate?: boolean;
  labelClassName?: string;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  name: string;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  error?: string;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  required?: boolean;
  className?: string;
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

export const RadioButton = forwardRef<HTMLInputElement, RadioButtonProps>(({
  label,
  description,
  size = 'md',
  variant = 'default',
  error,
  animate = true,
  labelClassName,
  className,
  disabled,
  checked,
  id,
  ...props
}, ref) => {
  const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

  const radioClasses = clsx(
    sizeClasses[size],
    variantClasses[variant],
    'border-gray-300 focus:ring-2 focus:ring-offset-2',
    'transition-colors duration-200',
    disabled && 'opacity-50 cursor-not-allowed',
    error && 'border-danger-300 text-danger-600 focus:ring-danger-500',
    className
  );

  const radioElement = animate ? (
    <motion.input
      ref={ref}
      type="radio"
      id={radioId}
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
      type="radio"
      id={radioId}
      className={radioClasses}
      disabled={disabled}
      checked={checked}
      {...props}
    />
  );

  if (!label && !description) {
    return radioElement;
  }

  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        {radioElement}
      </div>
      {(label || description) && (
        <div className="ml-3 text-sm">
          {label && (
            <label
              htmlFor={radioId}
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
        </div>
      )}
    </div>
  );
});

RadioButton.displayName = 'RadioButton';

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  name,
  label,
  description,
  size = 'md',
  variant = 'default',
  error,
  orientation = 'vertical',
  disabled = false,
  required = false,
  className,
}) => {
  const handleChange = (optionValue: string | number) => {
    if (!disabled) {
      onChange(optionValue);
    }
  };

  const groupId = `radiogroup-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className}>
      {label && (
        <label
          className={clsx(
            'block text-sm font-medium text-gray-700 mb-3',
            required && "after:content-['*'] after:text-danger-500 after:ml-1",
            disabled && 'opacity-50'
          )}
        >
          {label}
        </label>
      )}

      {description && (
        <p className={clsx(
          'text-sm text-gray-500 mb-3',
          disabled && 'opacity-50',
          error && 'text-danger-600'
        )}>
          {description}
        </p>
      )}

      <div
        className={clsx(
          'space-y-3',
          orientation === 'horizontal' && 'flex flex-wrap gap-6 space-y-0'
        )}
        role="radiogroup"
        aria-labelledby={label ? groupId : undefined}
        aria-describedby={error ? `${groupId}-error` : undefined}
      >
        {options.map((option, index) => (
          <RadioButton
            key={option.value}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => handleChange(option.value)}
            label={option.label}
            description={option.description}
            size={size}
            variant={variant}
            disabled={disabled || option.disabled}
            error={error}
            id={`${groupId}-option-${index}`}
          />
        ))}
      </div>

      {error && (
        <p id={`${groupId}-error`} className="text-danger-600 text-sm mt-2">
          {error}
        </p>
      )}
    </div>
  );
};

export default RadioButton;