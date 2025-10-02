import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import Button from '../../ui/Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  image?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    icon?: React.ReactNode;
  };
  className?: string;
  compact?: boolean;
  animated?: boolean;
}

const defaultIcons = {
  tasks: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  search: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  filter: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
    </svg>
  ),
  inbox: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0l-3.5-3.5a2 2 0 00-1.414-.586H8.914a2 2 0 00-1.414.586L4 13" />
    </svg>
  ),
  folder: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  calendar: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  users: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  image,
  action,
  secondaryAction,
  className,
  compact = false,
  animated = true,
}) => {
  const containerClasses = clsx(
    'flex flex-col items-center justify-center text-center',
    compact ? 'py-8' : 'py-12 px-4',
    className
  );

  const content = (
    <div className={containerClasses}>
      {/* Image or Icon */}
      <div className={clsx(
        'flex items-center justify-center mb-4',
        compact ? 'mb-3' : 'mb-6'
      )}>
        {image ? (
          <img
            src={image}
            alt=""
            className={clsx(
              'object-contain',
              compact ? 'w-24 h-24' : 'w-32 h-32'
            )}
          />
        ) : (
          <div className={clsx(
            'text-gray-400',
            compact ? 'w-16 h-16' : 'w-20 h-20'
          )}>
            {icon || defaultIcons.tasks}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className={clsx(
        'font-semibold text-gray-900 mb-2',
        compact ? 'text-base' : 'text-lg'
      )}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={clsx(
          'text-gray-600 mb-6 max-w-sm leading-relaxed',
          compact ? 'text-sm mb-4' : 'text-base'
        )}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className={clsx(
          'flex flex-col sm:flex-row gap-3',
          compact && 'flex-col gap-2'
        )}>
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              leftIcon={action.icon}
              size={compact ? 'sm' : 'md'}
            >
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'ghost'}
              onClick={secondaryAction.onClick}
              leftIcon={secondaryAction.icon}
              size={compact ? 'sm' : 'md'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

// Pre-built empty states for common scenarios
export const NoTasksFound: React.FC<Partial<EmptyStateProps> & {
  onCreateTask?: () => void;
  searchQuery?: string;
}> = ({ onCreateTask, searchQuery, ...props }) => (
  <EmptyState
    {...props}
    icon={searchQuery ? defaultIcons.search : defaultIcons.tasks}
    title={searchQuery ? `No tasks found for "${searchQuery}"` : 'No tasks yet'}
    description={
      searchQuery
        ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
        : 'Get started by creating your first task to stay organized and productive.'
    }
    action={
      onCreateTask
        ? {
            label: 'Create Task',
            onClick: onCreateTask,
            variant: 'primary' as const,
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            ),
          }
        : undefined
    }
    secondaryAction={
      searchQuery
        ? {
            label: 'Clear Search',
            onClick: () => window.location.reload(),
            variant: 'ghost' as const,
          }
        : undefined
    }
  />
);

export const NoResultsFound: React.FC<Partial<EmptyStateProps> & {
  searchQuery?: string;
  onClearFilters?: () => void;
}> = ({ searchQuery, onClearFilters, ...props }) => (
  <EmptyState
    {...props}
    icon={defaultIcons.search}
    title={searchQuery ? `No results for "${searchQuery}"` : 'No results found'}
    description="Try adjusting your search terms or clearing your filters to see more results."
    action={
      onClearFilters
        ? {
            label: 'Clear Filters',
            onClick: onClearFilters,
            variant: 'primary' as const,
          }
        : undefined
    }
  />
);

export const EmptyInbox: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    {...props}
    icon={defaultIcons.inbox}
    title="Inbox is empty"
    description="Great job! You've processed all your notifications and updates."
  />
);

export const EmptyCalendar: React.FC<Partial<EmptyStateProps> & {
  onCreateEvent?: () => void;
}> = ({ onCreateEvent, ...props }) => (
  <EmptyState
    {...props}
    icon={defaultIcons.calendar}
    title="No events scheduled"
    description="Your calendar is clear. Add some events to stay organized."
    action={
      onCreateEvent
        ? {
            label: 'Add Event',
            onClick: onCreateEvent,
            variant: 'primary' as const,
          }
        : undefined
    }
  />
);

export const EmptyFolder: React.FC<Partial<EmptyStateProps> & {
  folderName?: string;
  onAddFile?: () => void;
}> = ({ folderName, onAddFile, ...props }) => (
  <EmptyState
    {...props}
    icon={defaultIcons.folder}
    title={`${folderName || 'This folder'} is empty`}
    description="Add some files to get started."
    action={
      onAddFile
        ? {
            label: 'Add File',
            onClick: onAddFile,
            variant: 'primary' as const,
          }
        : undefined
    }
  />
);

export const NetworkError: React.FC<Partial<EmptyStateProps> & {
  onRetry?: () => void;
}> = ({ onRetry, ...props }) => (
  <EmptyState
    {...props}
    icon={(
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )}
    title="Connection Error"
    description="Unable to load data. Please check your internet connection and try again."
    action={
      onRetry
        ? {
            label: 'Retry',
            onClick: onRetry,
            variant: 'primary' as const,
          }
        : undefined
    }
  />
);

export default EmptyState;