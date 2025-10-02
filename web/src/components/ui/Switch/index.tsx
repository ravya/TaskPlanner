import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  size?: SwitchSize;
  error?: string;
  animate?: boolean;
  labelPosition?: 'left' | 'right';
  className?: string;
  labelClassName?: string;
}

const sizeClasses: Record<SwitchSize, {
  container: string;
  toggle: string;
  translate: string;
}> = {
  sm: {
    container: 'w-8 h-4',
    toggle: 'w-3 h-3',
    translate: 'translate-x-4',
  },
  md: {
    container: 'w-11 h-6',
    toggle: 'w-5 h-5',
    translate: 'translate-x-5',
  },
  lg: {
    container: 'w-14 h-7',
    toggle: 'w-6 h-6',
    translate: 'translate-x-7',
  },
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(({
  label,
  description,
  size = 'md',
  error,
  animate = true,
  labelPosition = 'right',
  className,
  labelClassName,
  disabled,
  checked,
  id,
  ...props
}, ref) => {
  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;
  const { container, toggle, translate } = sizeClasses[size];

  const switchClasses = clsx(
    'relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
    checked ? 'bg-primary-600' : 'bg-gray-200',
    disabled && 'opacity-50 cursor-not-allowed',
    error && 'ring-2 ring-danger-500',
    container,
    className
  );

  const toggleClasses = clsx(
    'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
    checked ? translate : 'translate-x-0',
    toggle
  );

  const switchElement = (
    <label htmlFor={switchId} className="flex items-center cursor-pointer">
      <span className={switchClasses}>
        <input
          ref={ref}
          type="checkbox"
          id={switchId}
          className="sr-only"
          disabled={disabled}
          checked={checked}
          {...props}
        />
        {animate ? (
          <motion.span
            className={clsx(
              'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0',
              toggle
            )}
            animate={{
              x: checked ? translate.replace('translate-x-', '') : '0',
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        ) : (
          <span className={toggleClasses} />
        )}
      </span>
    </label>
  );

  if (!label && !description) {
    return switchElement;
  }

  const content = labelPosition === 'left' ? [
    (label || description) && (
      <div key="labels" className="text-sm">
        {label && (
          <span className={clsx(
            'font-medium text-gray-900',
            disabled && 'opacity-50',
            error && 'text-danger-700',
            labelClassName
          )}>
            {label}
          </span>
        )}
        {description && (
          <span className={clsx(
            'text-gray-500 block',
            disabled && 'opacity-50',
            error && 'text-danger-600'
          )}>
            {description}
          </span>
        )}
      </div>
    ),
    <div key="switch">{switchElement}</div>,
  ] : [
    <div key="switch">{switchElement}</div>,
    (label || description) && (
      <div key="labels" className="text-sm ml-3">
        {label && (
          <span className={clsx(
            'font-medium text-gray-900',
            disabled && 'opacity-50',
            error && 'text-danger-700',
            labelClassName
          )}>
            {label}
          </span>
        )}
        {description && (
          <span className={clsx(
            'text-gray-500 block',
            disabled && 'opacity-50',
            error && 'text-danger-600'
          )}>
            {description}
          </span>
        )}
      </div>
    ),
  ];

  return (
    <div className="flex items-center justify-between">
      {content}
      {error && (
        <p className="text-danger-600 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
});

Switch.displayName = 'Switch';

export default Switch;