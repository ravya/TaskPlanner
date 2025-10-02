import React from 'react';
import { clsx } from 'clsx';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean | 'full' | 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const roundedClasses = {
  true: 'rounded',
  full: 'rounded-full',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  className,
  rounded = true,
  animate = true,
}) => {
  const skeletonClasses = clsx(
    'bg-gray-300',
    animate && 'animate-pulse',
    rounded && roundedClasses[rounded === true ? 'true' : rounded],
    className
  );

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return <div className={skeletonClasses} style={style} />;
};

// Preset skeleton components
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className }) => (
  <div className={clsx('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        height="1rem"
        width={index === lines - 1 ? '75%' : '100%'}
        className="skeleton-text"
      />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 40, className }) => (
  <Skeleton
    width={size}
    height={size}
    rounded="full"
    className={clsx('skeleton-avatar', className)}
  />
);

export const SkeletonCard: React.FC<{
  className?: string;
}> = ({ className }) => (
  <div className={clsx('space-y-4 p-4', className)}>
    <Skeleton height="200px" className="w-full" />
    <div className="space-y-2">
      <Skeleton height="1.5rem" width="60%" />
      <SkeletonText lines={2} />
    </div>
  </div>
);

export const SkeletonList: React.FC<{
  items?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({ items = 3, showAvatar = false, className }) => (
  <div className={clsx('space-y-4', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4">
        {showAvatar && <SkeletonAvatar />}
        <div className="flex-1 space-y-2">
          <Skeleton height="1rem" width="40%" />
          <Skeleton height="0.75rem" width="75%" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;