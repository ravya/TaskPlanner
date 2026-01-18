import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import Tooltip from '../../ui/Tooltip';
import { projectService } from '../../../services/firebase/project.service';
import { useAuthStore } from '../../../store/slices/authSlice';
import type { Project } from '../../../types/project';
import AddProjectModal from '../../AddProjectModal';

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
    id: 'today',
    label: "Today",
    path: '/tasks?filter=today',
    icon: (
      <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  },
  {
    id: 'upcoming',
    label: 'Upcoming',
    path: '/tasks?filter=upcoming',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    ),
  },
  {
    id: 'recurring',
    label: 'Recurring',
    path: '/tasks?filter=recurring',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    id: 'backlog',
    label: 'Backlog',
    path: '/tasks?filter=backlog',
    icon: (
      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'completed',
    label: 'Completed',
    path: '/tasks?filter=completed',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'trash',
    label: 'Trash',
    path: '/tasks?filter=trash',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
];

const settingsItems: NavigationItem[] = [
  {
    id: 'widget',
    label: 'Widget',
    path: '/widget',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
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
    path: '/help',
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
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      return projectService.subscribeToProjects(user.uid, (data: Project[]) => {
        setProjects(data);
      });
    }
  }, [user?.uid]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const isActiveItem = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className={clsx('px-3 space-y-6', className)}>
      {/* Main navigation */}
      <div className="space-y-1">
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

      {/* Projects navigation */}
      <div className="space-y-1">
        {!collapsed && (
          <div className="px-3 flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Projects
            </h3>
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowAddProjectModal(true);
              }}
              className="text-gray-400 hover:text-primary-600 transition-colors"
              title="Add Project"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}

        <div className="space-y-1">
          {projects
            .filter(p => !p.isDefault)
            .map((project) => (
              <NavigationItemComponent
                key={project.id}
                item={{
                  id: project.id,
                  label: project.name,
                  path: `/tasks?projectId=${project.id}`,
                  icon: (
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color || '#9CA3AF' }}></span>
                  ),
                  badge: project.taskCount > 0 ? project.taskCount : undefined
                }}
                isActive={location.search.includes(`projectId=${project.id}`)}
                collapsed={collapsed}
                onClick={handleNavigate}
              />
            ))}
          {projects.length === 0 && !collapsed && (
            <p className="px-3 py-2 text-xs text-gray-400 italic">No projects yet</p>
          )}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="space-y-1">
        <NavigationItemComponent
          item={{
            id: 'analytics',
            label: 'Analytics',
            path: '/analytics',
            icon: (
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
          }}
          isActive={isActiveItem('/analytics')}
          collapsed={collapsed}
          onClick={handleNavigate}
        />
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

      {/* Modals */}
      {showAddProjectModal && user && (
        <AddProjectModal
          userId={user.uid}
          mode="personal" // Default to personal, or we could track current mode
          onClose={() => setShowAddProjectModal(false)}
          onCreated={(project) => {
            setShowAddProjectModal(false);
            handleNavigate(`/tasks?projectId=${project.id}`);
          }}
        />
      )}
    </nav>
  );
};

export default Navigation;