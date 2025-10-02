import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// Input size types
export type InputSize = 'sm' | 'md' | 'lg';

// Input variant types for different states
export type InputVariant = 'default' | 'error' | 'success' | 'warning';

// Base input props interface
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  variant?: InputVariant;
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
  animate?: boolean;
  containerClassName?: string;
}

// Input size classes
const sizeClasses: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

// Input variant classes
const variantClasses: Record<InputVariant, string> = {
  default: 'form-input',
  error: 'form-input border-danger-300 focus:ring-danger-500',
  success: 'form-input border-success-300 focus:ring-success-500',
  warning: 'form-input border-warning-300 focus:ring-warning-500',
};

// Animation variants
const inputVariants = {
  focus: {
    scale: 1.01,
    transition: { duration: 0.2 }
  },
  blur: {
    scale: 1,
    transition: { duration: 0.2 }
  }
};

// Forward ref input component
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  size = 'md',
  variant = 'default',
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  leftElement,
  rightElement,
  fullWidth = true,
  animate = true,
  containerClassName,
  className,
  disabled,
  required,
  id,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  
  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  // Determine final variant based on error prop
  const finalVariant = error ? 'error' : variant;
  
  const inputClasses = clsx(
    variantClasses[finalVariant],
    sizeClasses[size],
    leftIcon || leftElement ? 'pl-10' : '',
    rightIcon || rightElement ? 'pr-10' : '',
    fullWidth ? 'w-full' : '',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  const containerClasses = clsx(
    'relative',
    fullWidth ? 'w-full' : 'inline-block',
    containerClassName
  );

  const iconClasses = 'absolute top-1/2 transform -translate-y-1/2 text-gray-400';

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const inputElement = animate ? (
    <motion.input
      ref={ref}
      id={inputId}
      className={inputClasses}
      disabled={disabled}
      required={required}
      variants={inputVariants}
      animate={isFocused ? 'focus' : 'blur'}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  ) : (
    <input
      ref={ref}
      id={inputId}
      className={inputClasses}
      disabled={disabled}
      required={required}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );

  return (
    <div className={containerClasses}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={clsx(
            'form-label',
            required && "after:content-['*'] after:text-danger-500 after:ml-1",
            disabled && 'opacity-50'
          )}
        >
          {label}
        </label>
      )}

      {/* Input container with icons/elements */}
      <div className="relative">
        {/* Left icon or element */}
        {leftIcon && (
          <div className={clsx(iconClasses, 'left-3')}>
            {leftIcon}
          </div>
        )}
        {leftElement && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {leftElement}
          </div>
        )}

        {/* Input field */}
        {inputElement}

        {/* Right icon or element */}
        {rightIcon && (
          <div className={clsx(iconClasses, 'right-3')}>
            {rightIcon}
          </div>
        )}
        {rightElement && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>

      {/* Hint text */}
      {hint && !error && (
        <p className="form-hint">
          {hint}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="form-error">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea component with similar API
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: InputSize;
  variant?: InputVariant;
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  size = 'md',
  variant = 'default',
  label,
  hint,
  error,
  fullWidth = true,
  resize = 'vertical',
  containerClassName,
  className,
  disabled,
  required,
  id,
  rows = 3,
  ...props
}, ref) => {
  // Generate unique ID if not provided
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  // Determine final variant based on error prop
  const finalVariant = error ? 'error' : variant;
  
  const textareaClasses = clsx(
    variantClasses[finalVariant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    resize === 'none' && 'resize-none',
    resize === 'vertical' && 'resize-y',
    resize === 'horizontal' && 'resize-x',
    resize === 'both' && 'resize',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  const containerClasses = clsx(
    fullWidth ? 'w-full' : 'inline-block',
    containerClassName
  );

  return (
    <div className={containerClasses}>
      {/* Label */}
      {label && (
        <label
          htmlFor={textareaId}
          className={clsx(
            'form-label',
            required && "after:content-['*'] after:text-danger-500 after:ml-1",
            disabled && 'opacity-50'
          )}
        >
          {label}
        </label>
      )}

      {/* Textarea */}
      <textarea
        ref={ref}
        id={textareaId}
        className={textareaClasses}
        disabled={disabled}
        required={required}
        rows={rows}
        {...props}
      />

      {/* Hint text */}
      {hint && !error && (
        <p className="form-hint">
          {hint}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="form-error">
          {error}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// Input group for combining inputs with buttons or other elements
export interface InputGroupProps {
  children: React.ReactNode;
  size?: InputSize;
  className?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({
  children,
  size = 'md',
  className,
}) => {
  return (
    <div className={clsx('flex', className)} data-size={size}>
      {children}
    </div>
  );
};

// Password input with toggle visibility
export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showToggle?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({
  showToggle = true,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const rightIcon = showToggle ? (
    <button
      type="button"
      onClick={togglePassword}
      className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
      tabIndex={-1}
    >
      {showPassword ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L12 12m-3.536-3.536l1.414 1.414m0 0L12 12m4.242-4.242L8.464 8.464" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  ) : undefined;

  return (
    <Input
      {...props}
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      rightIcon={rightIcon}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

export default Input;