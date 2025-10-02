import React from 'react';
import { clsx } from 'clsx';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
  fallback?: React.ReactNode;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className,
  fallback,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const avatarClasses = clsx(
    'relative inline-flex items-center justify-center rounded-full bg-gray-300 font-medium text-gray-700 overflow-hidden',
    sizeClasses[size],
    className
  );

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const shouldShowImage = src && !imageError;
  const displayName = alt || name || 'User';
  const initials = name ? getInitials(name) : '?';

  return (
    <span className={avatarClasses}>
      {shouldShowImage ? (
        <img
          src={src}
          alt={displayName}
          className={clsx(
            'w-full h-full object-cover',
            !imageLoaded && 'opacity-0'
          )}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      ) : fallback ? (
        fallback
      ) : (
        <span className="font-medium">{initials}</span>
      )}
    </span>
  );
};

export default Avatar;