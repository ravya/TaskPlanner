import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export interface UseAuthRedirectOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  requireVerified?: boolean;
  requireAdmin?: boolean;
  onRedirect?: (reason: string) => void;
}

export interface UseAuthRedirectReturn {
  shouldRedirect: boolean;
  redirectReason: string | null;
  performRedirect: () => void;
}

export const useAuthRedirect = (options: UseAuthRedirectOptions = {}): UseAuthRedirectReturn => {
  const {
    redirectTo = '/dashboard',
    requireAuth = false,
    requireVerified = false,
    requireAdmin = false,
    onRedirect,
  } = options;

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  let shouldRedirect = false;
  let redirectReason: string | null = null;
  let targetUrl = redirectTo;

  // Don't redirect while loading
  if (isLoading) {
    return { shouldRedirect: false, redirectReason: null, performRedirect: () => {} };
  }

  // Check authentication requirements
  if (requireAuth && !isAuthenticated) {
    shouldRedirect = true;
    redirectReason = 'authentication_required';
    targetUrl = `/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
  } else if (!requireAuth && isAuthenticated) {
    // User is authenticated but route doesn't require auth (e.g., login page)
    shouldRedirect = true;
    redirectReason = 'already_authenticated';
    targetUrl = redirectTo;
  }

  // Check email verification requirement
  if (requireVerified && isAuthenticated && user && !user.emailVerified) {
    shouldRedirect = true;
    redirectReason = 'email_verification_required';
    targetUrl = `/auth/verify-email?redirect=${encodeURIComponent(location.pathname + location.search)}`;
  }

  // Check admin requirement
  if (requireAdmin && isAuthenticated && user && user.role !== 'admin') {
    shouldRedirect = true;
    redirectReason = 'admin_access_required';
    targetUrl = '/unauthorized';
  }

  const performRedirect = () => {
    if (shouldRedirect && redirectReason) {
      onRedirect?.(redirectReason);
      navigate(targetUrl, { replace: true });
    }
  };

  return {
    shouldRedirect,
    redirectReason,
    performRedirect,
  };
};

// Hook for automatic redirects based on auth state
export const useAutoAuthRedirect = (options: UseAuthRedirectOptions = {}) => {
  const { shouldRedirect, redirectReason, performRedirect } = useAuthRedirect(options);

  useEffect(() => {
    if (shouldRedirect) {
      performRedirect();
    }
  }, [shouldRedirect, performRedirect]);

  return { redirectReason };
};

// Hook for redirecting after successful authentication
export const usePostAuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterAuth = (fallback: string = '/dashboard') => {
    // Get the intended destination from location state or query params
    const state = location.state as { from?: Location } | null;
    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get('redirect');
    
    const destination = state?.from?.pathname || redirectParam || fallback;
    
    navigate(destination, { replace: true });
  };

  return { redirectAfterAuth };
};

// Hook for handling conditional navigation based on auth state
export const useAuthNavigation = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const navigateWithAuthCheck = (
    path: string,
    options?: {
      requireAuth?: boolean;
      requireVerified?: boolean;
      requireAdmin?: boolean;
      authFallback?: string;
      replace?: boolean;
    }
  ) => {
    const {
      requireAuth = false,
      requireVerified = false,
      requireAdmin = false,
      authFallback = '/auth/login',
      replace = false,
    } = options || {};

    // Check authentication
    if (requireAuth && !isAuthenticated) {
      navigate(`${authFallback}?redirect=${encodeURIComponent(path)}`, { replace });
      return false;
    }

    // Check email verification
    if (requireVerified && user && !user.emailVerified) {
      navigate(`/auth/verify-email?redirect=${encodeURIComponent(path)}`, { replace });
      return false;
    }

    // Check admin access
    if (requireAdmin && user && user.role !== 'admin') {
      navigate('/unauthorized', { replace });
      return false;
    }

    // All checks passed, navigate to intended path
    navigate(path, { replace });
    return true;
  };

  return { navigateWithAuthCheck };
};

export default useAuthRedirect;