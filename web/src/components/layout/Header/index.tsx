import React from 'react';
import { clsx } from 'clsx';
import { useUIStore } from '../../../store/slices/uiSlice';
import { useAuthStore } from '../../../store/slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import Button from '../../ui/Button';
import Avatar from '../../ui/Avatar';
import Dropdown, { DropdownItem } from '../../ui/Dropdown';

export interface HeaderProps {
  className?: string;
  showSidebarToggle?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  className,
  showSidebarToggle = true,
  showSearch = true,
  showNotifications = true,
  showUserMenu = true,
}) => {
  const {
    sidebarOpen,
    toggleSidebar,
    searchQuery,
    setSearchQuery,
    searchFocused,
    setSearchFocused,
    notifications,
    clearNotifications,
    removeNotification
  } = useUIStore();

  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const userMenuItems: DropdownItem[] = [
    {
      id: 'profile',
      label: 'Profile Settings',
      value: 'profile',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      value: 'settings',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'divider',
      label: '',
      value: 'divider',
      divider: true,
    },
    {
      id: 'logout',
      label: 'Sign Out',
      value: 'logout',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
    },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
  };

  const handleUserMenuSelect = (item: DropdownItem) => {
    switch (item.value) {
      case 'profile':
        navigate('/settings');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        getAuth().signOut().then(() => {
          logout();
          navigate('/login');
        });
        break;
    }
  };

  return (
    <header className={clsx(
      'header bg-white border-b border-gray-200 sticky top-0 z-40',
      'flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8',
      className
    )}>
      {/* Left section */}
      <div className="flex items-center space-x-4">
        {/* Sidebar toggle */}
        {showSidebarToggle && (
          <Button
            variant="ghost"
            size="md"
            onClick={toggleSidebar}
            className="lg:hidden"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        )}

        {/* Logo */}
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-bold text-gray-900">
            TaskFlow
          </h1>
        </Link>
      </div>

      {/* Center section - Search */}
      {showSearch && (
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className={clsx(
                'block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg',
                'placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                'transition-all duration-200 sm:text-sm',
                searchFocused && 'ring-2 ring-primary-500 border-transparent'
              )}
              placeholder="Search tasks, tags, or notes..."
            />

            {/* Search suggestions or results could be added here */}
            {searchQuery && (
              <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-3 text-sm text-gray-500">
                  Search for "{searchQuery}"...
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right section */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        {showNotifications && (
          <Dropdown
            items={notifications.length > 0 ? [
              ...notifications.map(n => ({
                id: n.id,
                label: n.title,
                value: n.id,
                icon: (
                  <div className={clsx(
                    "w-2 h-2 rounded-full",
                    n.type === 'success' ? "bg-green-500" :
                      n.type === 'error' ? "bg-red-500" :
                        n.type === 'warning' ? "bg-yellow-500" : "bg-blue-500"
                  )} />
                )
              })),
              { id: 'divider', label: '', value: 'divider', divider: true },
              { id: 'clear', label: 'Clear All', value: 'clear', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> }
            ] : [{ id: 'none', label: 'No new notifications', value: 'none', disabled: true }]}
            onSelect={(item) => {
              if (item.value === 'clear') {
                clearNotifications();
              } else if (item.value !== 'divider' && item.value !== 'none') {
                removeNotification(item.value);
              }
            }}
            placeholder="No notifications"
            buttonClassName="relative p-2 rounded-lg hover:bg-gray-100 transition-colors border-none shadow-none"
            menuClassName="w-80"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>

            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                {notifications.length}
              </span>
            )}
          </Dropdown>
        )}

        {/* User menu */}
        {showUserMenu && isAuthenticated && user && (
          <Dropdown
            items={userMenuItems}
            onSelect={handleUserMenuSelect}
            buttonClassName="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Avatar
              src={user.photoURL || undefined}
              name={user.displayName || user.email || undefined}
              size="sm"
            />
            <span className="hidden md:block text-sm font-medium text-gray-700">
              {user.displayName || user.email}
            </span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Dropdown>
        )}

        {/* Sign in button for non-authenticated users */}
        {!isAuthenticated && (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="md">
              Sign In
            </Button>
            <Button variant="primary" size="md">
              Get Started
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;