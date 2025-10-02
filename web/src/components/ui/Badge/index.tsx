import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  animate?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-primary-100 text-primary-800',
  secondary: 'bg-gray-100 text-gray-800',
  success: 'bg-success-100 text-success-800',
  warning: 'bg-warning-100 text-warning-800',
  danger: 'bg-danger-100 text-danger-800',
  info: 'bg-blue-100 text-blue-800',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-base',
};

const dotSizeClasses: Record<BadgeSize, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  removable = false,
  onRemove,
  className,
  animate = true,
}) => {
  const badgeClasses = clsx(
    'inline-flex items-center rounded-full font-medium',
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  const dotColor = {
    default: 'bg-gray-400',
    primary: 'bg-primary-600',
    secondary: 'bg-gray-400',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600',
    info: 'bg-blue-600',
  }[variant];

  const content = (
    <>
      {dot && (
        <span className={clsx(
          'rounded-full mr-1.5',
          dotSizeClasses[size],
          dotColor
        )} />
      )}
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1.5 -mr-0.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-current hover:bg-current hover:bg-opacity-20 focus:outline-none focus:bg-current focus:bg-opacity-20"
          aria-label="Remove"
        >
          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </>
  );

  if (animate) {
    return (
      <motion.span
        className={badgeClasses}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.span>
    );
  }

  return (
    <span className={badgeClasses}>
      {content}
    </span>
  );
};

export default Badge;