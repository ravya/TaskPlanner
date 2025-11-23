import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import LoadingSpinner from '../../common/LoadingSpinner';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireVerified?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
  onUnauthorized?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireVerified = false,
  redirectTo,
  fallback,
  onUnauthorized,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" label="Checking authentication..." />
        </div>
      )
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    onUnauthorized?.();
    const redirect = redirectTo || '/auth/login';
    return <Navigate to={redirect} state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && (!user?.role || user.role !== 'admin')) {
    onUnauthorized?.();
    return <Navigate to="/unauthorized" replace />;
  }

  // Check email verification requirement
  if (requireVerified && !user?.emailVerified) {
    onUnauthorized?.();
    return <Navigate to="/auth/verify-email" state={{ from: location }} replace />;
  }

  // If user is authenticated but route doesn't require auth (like login page)
  if (!requireAuth && isAuthenticated && redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

// Higher-order component for protecting routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) => {
  return (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Specific protected route components
export const AuthenticatedRoute: React.FC<{ children: React.ReactNode; redirectTo?: string }> = ({
  children,
  redirectTo = '/auth/login',
}) => (
  <ProtectedRoute requireAuth redirectTo={redirectTo}>
    {children}
  </ProtectedRoute>
);

export const UnauthenticatedRoute: React.FC<{ children: React.ReactNode; redirectTo?: string }> = ({
  children,
  redirectTo = '/dashboard',
}) => (
  <ProtectedRoute requireAuth={false} redirectTo={redirectTo}>
    {children}
  </ProtectedRoute>
);

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth requireAdmin>
    {children}
  </ProtectedRoute>
);

export const VerifiedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth requireVerified>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;