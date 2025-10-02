import React from 'react';
import { clsx } from 'clsx';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface ContainerProps {
  children: React.ReactNode;
  size?: ContainerSize;
  className?: string;
  centered?: boolean;
  padding?: boolean;
  as?: React.ElementType;
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  className,
  centered = true,
  padding = true,
  as: Component = 'div',
}) => {
  const containerClasses = clsx(
    'w-full',
    sizeClasses[size],
    centered && 'mx-auto',
    padding && 'px-4 sm:px-6 lg:px-8',
    className
  );

  return (
    <Component className={containerClasses}>
      {children}
    </Component>
  );
};

// Page container component with consistent spacing
export interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
  size?: ContainerSize;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  description,
  action,
  breadcrumbs,
  className,
  size = 'full',
}) => {
  return (
    <Container size={size} className={clsx('py-6', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <div className="mb-4">
          {breadcrumbs}
        </div>
      )}

      {/* Page header */}
      {(title || description || action) && (
        <div className={clsx(
          'flex flex-col sm:flex-row sm:items-center sm:justify-between',
          'mb-8 gap-4'
        )}>
          <div className="min-w-0 flex-1">
            {title && (
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-gray-600">
                {description}
              </p>
            )}
          </div>
          
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}

      {/* Page content */}
      <div>
        {children}
      </div>
    </Container>
  );
};

// Section container for organizing content within pages
export interface SectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
  background?: boolean;
  border?: boolean;
}

export const Section: React.FC<SectionProps> = ({
  children,
  title,
  description,
  action,
  className,
  spacing = 'normal',
  background = false,
  border = false,
}) => {
  const spacingClasses = {
    tight: 'py-4',
    normal: 'py-6',
    loose: 'py-8',
  };

  return (
    <section
      className={clsx(
        spacingClasses[spacing],
        background && 'bg-gray-50 rounded-lg px-6',
        border && 'border border-gray-200 rounded-lg px-6',
        className
      )}
    >
      {/* Section header */}
      {(title || description || action) && (
        <div className={clsx(
          'flex flex-col sm:flex-row sm:items-center sm:justify-between',
          'mb-6 gap-4'
        )}>
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-600">
                {description}
              </p>
            )}
          </div>
          
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}

      {/* Section content */}
      {children}
    </section>
  );
};

// Grid container for consistent grid layouts
export interface GridContainerProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  className?: string;
}

export const GridContainer: React.FC<GridContainerProps> = ({
  children,
  cols = 1,
  gap = 'md',
  responsive = true,
  className,
}) => {
  const colsClasses = {
    1: 'grid-cols-1',
    2: responsive ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2',
    3: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-3',
    4: responsive ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-4',
    5: responsive ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-5',
    6: responsive ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-6',
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12',
  };

  return (
    <div className={clsx(
      'grid',
      colsClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
};

// Card container for content cards
export interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  action,
  footer,
  className,
  padding = true,
  hover = false,
}) => {
  return (
    <div className={clsx(
      'bg-white rounded-lg shadow-soft border border-gray-200',
      hover && 'hover:shadow-medium transition-shadow duration-200',
      className
    )}>
      {/* Card header */}
      {(title || description || action) && (
        <div className={clsx(
          'flex items-center justify-between',
          padding ? 'px-6 py-4' : 'p-4',
          (children || footer) && 'border-b border-gray-200'
        )}>
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-600">
                {description}
              </p>
            )}
          </div>
          
          {action && (
            <div className="flex-shrink-0 ml-4">
              {action}
            </div>
          )}
        </div>
      )}

      {/* Card content */}
      {children && (
        <div className={padding ? 'px-6 py-4' : 'p-4'}>
          {children}
        </div>
      )}

      {/* Card footer */}
      {footer && (
        <div className={clsx(
          'bg-gray-50 rounded-b-lg',
          padding ? 'px-6 py-4' : 'p-4',
          children && 'border-t border-gray-200'
        )}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Container;