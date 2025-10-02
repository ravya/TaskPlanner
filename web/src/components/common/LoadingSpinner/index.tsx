import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'primary' | 'white' | 'gray';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  label?: string;
  fullScreen?: boolean;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const variantClasses: Record<SpinnerVariant, string> = {
  default: 'text-gray-600',
  primary: 'text-primary-600',
  white: 'text-white',
  gray: 'text-gray-400',
};

// Basic loading spinner
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  label = 'Loading...',
  fullScreen = false,
}) => {
  const spinnerElement = (
    <div className="flex flex-col items-center justify-center">
      <svg
        className={clsx(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          className="opacity-25"
        />
        <path
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          className="opacity-75"
        />
      </svg>
      
      {label && (
        <span className={clsx(
          'mt-2 text-sm font-medium',
          variantClasses[variant]
        )}>
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

// Dots loading indicator
export interface DotsSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
}

export const DotsSpinner: React.FC<DotsSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
}) => {
  const dotSize = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  }[size];

  return (
    <div className={clsx('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={clsx(
            'rounded-full',
            dotSize,
            variantClasses[variant].replace('text-', 'bg-')
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

// Pulse loading indicator
export interface PulseSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
}

export const PulseSpinner: React.FC<PulseSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
}) => {
  return (
    <motion.div
      className={clsx(
        'rounded-full border-2',
        sizeClasses[size],
        variantClasses[variant].replace('text-', 'border-'),
        className
      )}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
      }}
    />
  );
};

// Skeleton loading with bars
export interface BarsSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
}

export const BarsSpinner: React.FC<BarsSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
}) => {
  const barWidth = {
    xs: 'w-0.5',
    sm: 'w-0.5',
    md: 'w-1',
    lg: 'w-1',
    xl: 'w-1.5',
  }[size];

  const barHeight = {
    xs: 'h-3',
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-12',
  }[size];

  return (
    <div className={clsx('flex items-end space-x-0.5', className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className={clsx(
            'rounded-sm',
            barWidth,
            barHeight,
            variantClasses[variant].replace('text-', 'bg-')
          )}
          animate={{
            scaleY: [1, 0.5, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};

// Loading overlay component
export interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  spinner?: React.ReactNode;
  className?: string;
  blur?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  children,
  spinner,
  className,
  blur = true,
}) => {
  return (
    <div className={clsx('relative', className)}>
      {children}
      
      {loading && (
        <div className={clsx(
          'absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10',
          blur && 'backdrop-blur-sm'
        )}>
          {spinner || <LoadingSpinner />}
        </div>
      )}
    </div>
  );
};

// Page loading component
export interface PageLoadingProps {
  title?: string;
  description?: string;
  spinner?: React.ReactNode;
  className?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  title = 'Loading...',
  description,
  spinner,
  className,
}) => {
  return (
    <div className={clsx(
      'flex flex-col items-center justify-center min-h-[400px] text-center',
      className
    )}>
      {spinner || <LoadingSpinner size="lg" />}
      
      <h2 className="mt-4 text-lg font-semibold text-gray-900">
        {title}
      </h2>
      
      {description && (
        <p className="mt-2 text-sm text-gray-600 max-w-sm">
          {description}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;