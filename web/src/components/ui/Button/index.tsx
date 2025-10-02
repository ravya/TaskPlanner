import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// Button variant types
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'ghost' 
  | 'outline';

// Button size types
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Button props interface
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
  animate?: boolean;
}

// Base button classes
const baseClasses = 'btn-base interactive focus:outline-none focus:ring-2 focus:ring-offset-2';

// Variant classes
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  success: 'btn-success',
  warning: 'btn-warning',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
  outline: 'btn-outline',
};

// Size classes
const sizeClasses: Record<ButtonSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
  xl: 'btn-xl',
};

// Loading spinner component
const LoadingSpinner: React.FC<{ size: ButtonSize }> = ({ size }) => {
  const spinnerSize = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  }[size];

  return (
    <div className={clsx('loading-spinner', spinnerSize)} />
  );
};

// Animation variants for framer-motion
const buttonVariants = {
  initial: { scale: 1 },
  tap: { scale: 0.95 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  disabled: { opacity: 0.5, cursor: 'not-allowed' },
};

// Button component
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  className,
  animate = true,
  ...props
}) => {
  const buttonClasses = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    loading && 'cursor-wait',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  const content = (
    <>
      {loading ? (
        <LoadingSpinner size={size} />
      ) : (
        leftIcon && (
          <span className="flex-shrink-0 -ml-1 mr-2">
            {leftIcon}
          </span>
        )
      )}
      
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
      
      {!loading && rightIcon && (
        <span className="flex-shrink-0 ml-2 -mr-1">
          {rightIcon}
        </span>
      )}
    </>
  );

  if (animate && !disabled && !loading) {
    return (
      <motion.button
        className={buttonClasses}
        disabled={disabled || loading}
        variants={buttonVariants}
        initial="initial"
        whileTap="tap"
        whileHover="hover"
        {...props}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </button>
  );
};

// Button group component for related actions
export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'tight' | 'normal' | 'loose';
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  spacing = 'normal',
  className,
}) => {
  const groupClasses = clsx(
    'flex',
    orientation === 'horizontal' ? 'flex-row' : 'flex-col',
    {
      'gap-1': spacing === 'tight',
      'gap-2': spacing === 'normal',
      'gap-4': spacing === 'loose',
    },
    className
  );

  return (
    <div className={groupClasses} role="group">
      {children}
    </div>
  );
};

// Icon button component for actions with just icons
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
  tooltip?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  variant = 'ghost',
  className,
  ...props
}) => {
  const iconButtonClasses = clsx(
    'aspect-square flex items-center justify-center',
    className
  );

  return (
    <Button
      variant={variant}
      size={size}
      className={iconButtonClasses}
      {...props}
    >
      {icon}
    </Button>
  );
};

export default Button;