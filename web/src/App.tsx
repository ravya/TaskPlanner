import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from './store/slices/authSlice';

// Pages
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Widget = lazy(() => import('./pages/Widget'));
const StickiesDemo = lazy(() => import('./pages/StickiesDemo'));
const WidgetOnly = lazy(() => import('./pages/WidgetOnly'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const HelpSupport = lazy(() => import('./pages/HelpSupport'));
const Settings = lazy(() => import('./pages/Settings'));

import AppLayout from './components/layout/AppLayout';

// Simple loading component
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Auth Layout Wrapper
function AuthLayoutWrapper() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
}

// Protected Route Wrapper
function ProtectedRouteWrapper() {
  const { user, setUser, setLoading } = useAuthStore();
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Handle UserProfile type conversion
        const profile = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          emailVerified: currentUser.emailVerified,
          providerId: currentUser.providerData[0]?.providerId
        };
        setUser(profile as any);
      } else {
        setUser(null);
      }
      setLocalLoading(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  if (localLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayoutWrapper />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Standalone widget (has its own auth) */}
        <Route path="/w" element={<WidgetOnly />} />

        {/* Protected routes */}
        <Route element={<ProtectedRouteWrapper />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/widget" element={<Widget />} />
          <Route path="/stickies" element={<StickiesDemo />} />
          <Route path="/help" element={<HelpSupport />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
