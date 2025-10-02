import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'error' | 'success';
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  fullWidth?: boolean;
  containerClassName?: string;
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

const variantClasses = {
  default: 'form-input',
  error: 'form-input border-danger-300 focus:ring-danger-500',
  success: 'form-input border-success-300 focus:ring-success-500',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  options,
  size = 'md',
  variant = 'default',
  label,
  hint,
  error,
  placeholder,
  fullWidth = true,
  containerClassName,
  className,
  disabled,
  required,
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const finalVariant = error ? 'error' : variant;

  const selectClasses = clsx(
    variantClasses[finalVariant],
    sizeClasses[size],
    'pr-10 appearance-none bg-select',
    fullWidth ? 'w-full' : '',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  return (
    <div className={clsx(fullWidth ? 'w-full' : 'inline-block', containerClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className={clsx(
            'form-label',
            required && "after:content-['*'] after:text-danger-500 after:ml-1",
            disabled && 'opacity-50'
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={selectClasses}
          disabled={disabled}
          required={required}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {hint && !error && (
        <p className="form-hint">{hint}</p>
      )}

      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;