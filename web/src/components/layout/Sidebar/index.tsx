import React from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../../store/slices/uiSlice';
import Navigation from '../Navigation';
import { Link } from 'react-router-dom';

export interface SidebarProps {
  className?: string;
}



const backdropVariants = {
  open: { opacity: 1 },
  closed: { opacity: 0 },
};

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const {
    sidebarOpen,
    sidebarCollapsed,
    setSidebarOpen,
    toggleSidebarCollapsed
  } = useUIStore();

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const sidebarClasses = clsx(
    'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200',
    'transform transition-transform duration-300 ease-in-out lg:translate-x-0',
    'flex flex-col',
    sidebarCollapsed && 'lg:w-16',
    className
  );

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={clsx(
          sidebarClasses,
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Sidebar header */}
        <div className={clsx(
          'flex items-center justify-between p-4 border-b border-gray-200',
          sidebarCollapsed && 'lg:justify-center'
        )}>
          {!sidebarCollapsed && (
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              <h2 className="text-lg font-semibold text-gray-900">
                Home
              </h2>
            </Link>
          )}

          <div className="flex items-center space-x-2">
            {/* Collapse toggle for desktop */}
            <button
              onClick={toggleSidebarCollapsed}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                className={clsx(
                  'w-4 h-4 text-gray-600 transition-transform',
                  sidebarCollapsed && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Close button for mobile */}
            <button
              onClick={closeSidebar}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <Navigation collapsed={sidebarCollapsed} />
        </div>

        {/* Sidebar footer */}
        <div className={clsx(
          'p-4 border-t border-gray-200',
          sidebarCollapsed && 'lg:px-2'
        )}>
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Home
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    v1.0.0
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Sidebar spacer for desktop */}
      <div className={clsx(
        'hidden lg:block flex-shrink-0 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )} />
    </>
  );
};

export default Sidebar;