import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Tooltip from '../../ui/Tooltip';

export interface NavigationProps {
  collapsed?: boolean;
  className?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/app/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 002-2h14a2 2 0 002 2v0a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    id: 'tasks',
    label: 'Tasks',
    path: '/app/tasks',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    badge: 5, // Could be dynamic
  },
  {
    id: 'calendar',
    label: 'Calendar',
    path: '/app/calendar',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'tags',
    label: 'Tags',
    path: '/app/tags',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/app/reports',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const settingsItems: NavigationItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    path: '/app/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'help',
    label: 'Help & Support',
    path: '/app/help',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

interface NavigationItemComponentProps {
  item: NavigationItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: (path: string) => void;
}

const NavigationItemComponent: React.FC<NavigationItemComponentProps> = ({
  item,
  isActive,
  collapsed,
  onClick,
}) => {
  const handleClick = () => {
    onClick(item.path);
  };

  const itemContent = (
    <motion.button
      whileHover={{ x: collapsed ? 0 : 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={clsx(
        'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        collapsed ? 'justify-center' : 'justify-start',
        isActive
          ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
      )}
    >
      <span className="flex-shrink-0">
        {item.icon}
      </span>
      
      {!collapsed && (
        <>
          <span className="ml-3 flex-1 text-left">
            {item.label}
          </span>
          
          {item.badge && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
              {item.badge}
            </span>
          )}
        </>
      )}
    </motion.button>
  );

  if (collapsed) {
    return (
      <Tooltip content={item.label} position="right">
        {itemContent}
      </Tooltip>
    );
  }

  return itemContent;
};

export const Navigation: React.FC<NavigationProps> = ({
  collapsed = false,
  className,
}) => {
  const location = useLocation();

  const handleNavigate = (path: string) => {
    // In a real app, you'd use React Router's navigate here
    // navigate(path);
    console.log('Navigate to:', path);
  };

  const isActiveItem = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className={clsx('px-3 space-y-6', className)}>
      {/* Main navigation */}
      <div className="space-y-1">
        {!collapsed && (
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main
          </h3>
        )}
        
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <NavigationItemComponent
              key={item.id}
              item={item}
              isActive={isActiveItem(item.path)}
              collapsed={collapsed}
              onClick={handleNavigate}
            />
          ))}
        </div>
      </div>

      {/* Settings navigation */}
      <div className="space-y-1">
        {!collapsed && (
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Settings
          </h3>
        )}
        
        <div className="space-y-1">
          {settingsItems.map((item) => (
            <NavigationItemComponent
              key={item.id}
              item={item}
              isActive={isActiveItem(item.path)}
              collapsed={collapsed}
              onClick={handleNavigate}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="pt-6 mt-6 border-t border-gray-200">
          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </motion.button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;