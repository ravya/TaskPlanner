import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export type ProgressVariant = 'default' | 'success' | 'warning' | 'danger';
export type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
  className?: string;
}

const variantClasses: Record<ProgressVariant, string> = {
  default: 'bg-primary-600',
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  danger: 'bg-danger-600',
};

const sizeClasses: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-4',
};

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  striped = false,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const progressClasses = clsx(
    'w-full bg-gray-200 rounded-full overflow-hidden',
    sizeClasses[size],
    className
  );

  const fillClasses = clsx(
    'h-full rounded-full transition-all duration-300 ease-out',
    variantClasses[variant],
    striped && 'bg-stripes'
  );

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
          <span>{label}</span>
          {showLabel && <span>{percentage.toFixed(0)}%</span>}
        </div>
      )}
      
      <div className={progressClasses} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
        {animated ? (
          <motion.div
            className={fillClasses}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        ) : (
          <div
            className={fillClasses}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
};

// Circular Progress component
export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  variant = 'default',
  showLabel = false,
  label,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    default: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  };

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorMap[variant]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </svg>
      {(showLabel || label) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {showLabel && (
              <div className="text-2xl font-semibold text-gray-700">
                {percentage.toFixed(0)}%
              </div>
            )}
            {label && (
              <div className="text-sm text-gray-500">
                {label}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;