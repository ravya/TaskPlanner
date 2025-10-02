import React from 'react';
import { clsx } from 'clsx';
import { useUIStore } from '../../../store/slices/uiSlice';
import Header from '../Header';
import Sidebar from '../Sidebar';

export interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  showSidebar?: boolean;
  headerProps?: any;
  sidebarProps?: any;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  className,
  showHeader = true,
  showSidebar = true,
  headerProps = {},
  sidebarProps = {},
}) => {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className={clsx('min-h-screen bg-gray-50', className)}>
      {/* Sidebar */}
      {showSidebar && <Sidebar {...sidebarProps} />}

      {/* Main content area */}
      <div className={clsx(
        'flex flex-col min-h-screen',
        showSidebar && (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64')
      )}>
        {/* Header */}
        {showHeader && <Header {...headerProps} />}

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

// Full screen layout for auth pages, landing pages, etc.
export interface FullScreenLayoutProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  headerProps?: any;
}

export const FullScreenLayout: React.FC<FullScreenLayoutProps> = ({
  children,
  className,
  showHeader = false,
  headerProps = {},
}) => {
  return (
    <div className={clsx('min-h-screen bg-gray-50', className)}>
      {showHeader && <Header {...headerProps} />}
      
      <main className={clsx(
        'flex flex-col',
        showHeader ? 'min-h-[calc(100vh-4rem)]' : 'min-h-screen'
      )}>
        {children}
      </main>
    </div>
  );
};

// Split layout for auth forms, onboarding, etc.
export interface SplitLayoutProps {
  children: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  leftPanelProps?: {
    className?: string;
    background?: string;
  };
  rightPanelProps?: {
    className?: string;
    background?: string;
  };
  className?: string;
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({
  children,
  leftPanel,
  rightPanel,
  leftPanelProps = {},
  rightPanelProps = {},
  className,
}) => {
  return (
    <div className={clsx('min-h-screen flex', className)}>
      {/* Left panel */}
      {leftPanel && (
        <div className={clsx(
          'hidden lg:flex lg:flex-1 lg:flex-col',
          leftPanelProps.background || 'bg-primary-600',
          leftPanelProps.className
        )}>
          {leftPanel}
        </div>
      )}

      {/* Main content */}
      <div className={clsx(
        'flex-1 flex flex-col justify-center',
        rightPanelProps.background || 'bg-white',
        rightPanelProps.className
      )}>
        {children}
      </div>

      {/* Right panel */}
      {rightPanel && (
        <div className={clsx(
          'hidden lg:flex lg:flex-1 lg:flex-col',
          rightPanelProps.background || 'bg-gray-100',
          rightPanelProps.className
        )}>
          {rightPanel}
        </div>
      )}
    </div>
  );
};

// Center layout for simple pages
export interface CenterLayoutProps {
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  showHeader?: boolean;
  headerProps?: any;
}

export const CenterLayout: React.FC<CenterLayoutProps> = ({
  children,
  maxWidth = 'max-w-md',
  className,
  showHeader = false,
  headerProps = {},
}) => {
  return (
    <div className={clsx('min-h-screen bg-gray-50', className)}>
      {showHeader && <Header {...headerProps} />}
      
      <main className={clsx(
        'flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8',
        showHeader ? 'min-h-[calc(100vh-4rem)]' : 'min-h-screen'
      )}>
        <div className={clsx('w-full', maxWidth)}>
          {children}
        </div>
      </main>
    </div>
  );
};

// Modal layout for overlay content
export interface ModalLayoutProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  showCloseButton?: boolean;
}

export const ModalLayout: React.FC<ModalLayoutProps> = ({
  children,
  isOpen,
  onClose,
  size = 'md',
  className,
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full h-full',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className={clsx(
          'relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full',
          sizeClasses[size],
          className
        )}>
          {showCloseButton && (
            <button
              type="button"
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1"
              onClick={onClose}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;