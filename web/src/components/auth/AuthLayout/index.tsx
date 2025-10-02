import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  showBackToHome?: boolean;
  backgroundImage?: string;
  className?: string;
  formClassName?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showLogo = true,
  showBackToHome = true,
  backgroundImage,
  className,
  formClassName,
}) => {
  return (
    <div className={`min-h-screen flex ${className || ''}`}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 lg:py-12 bg-gradient-to-br from-primary-600 to-primary-800">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto text-white"
        >
          <div className="mb-8">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">TaskFlow</h1>
            <p className="mt-2 text-lg text-primary-100">
              Streamline your productivity with intelligent task management
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded-md">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Smart Organization</h3>
                <p className="text-primary-100">AI-powered task categorization and prioritization</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded-md">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Real-time Sync</h3>
                <p className="text-primary-100">Access your tasks anywhere, anytime</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded-md">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Advanced Planning</h3>
                <p className="text-primary-100">Timeline view and deadline management</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-primary-700 bg-opacity-50 rounded-lg">
            <blockquote>
              <p className="text-lg italic">
                "TaskFlow has revolutionized how our team manages projects. The intuitive interface and powerful features make productivity effortless."
              </p>
              <footer className="mt-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-300 rounded-full flex items-center justify-center">
                      <span className="text-primary-800 font-medium text-sm">JD</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-base font-medium">Jane Doe</div>
                    <div className="text-primary-200">Product Manager, TechCorp</div>
                  </div>
                </div>
              </footer>
            </blockquote>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`max-w-sm mx-auto w-full ${formClassName || ''}`}
        >
          {/* Back to Home Link */}
          {showBackToHome && (
            <div className="mb-6">
              <Link
                to="/"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 group"
              >
                <svg
                  className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to home
              </Link>
            </div>
          )}

          {/* Logo for Mobile */}
          {showLogo && (
            <div className="mb-8 lg:hidden text-center">
              <Link to="/" className="inline-flex items-center">
                <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 text-xl font-bold text-gray-900">TaskFlow</span>
              </Link>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>

          {/* Form Content */}
          <div className="bg-white">
            {children}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-6 text-sm text-gray-600">
            <Link to="/help" className="hover:text-gray-900">
              Help
            </Link>
            <Link to="/privacy" className="hover:text-gray-900">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-gray-900">
              Terms
            </Link>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            © 2024 TaskFlow. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;