import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from '../../ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error reporting service
    if (import.meta.env.PROD) {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          showDetails={this.props.showDetails}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
  onReload: () => void;
  showDetails?: boolean;
  className?: string;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  errorInfo,
  onRetry,
  onReload,
  showDetails = false,
  className,
}) => {
  const [detailsVisible, setDetailsVisible] = React.useState(false);

  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] px-4 text-center ${className}`}>
      <div className="max-w-md">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-danger-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Oops! Something went wrong
        </h1>
        
        <p className="text-gray-600 mb-6">
          We're sorry, but something unexpected happened. Please try again or reload the page.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Button
            variant="primary"
            onClick={onRetry}
            className="min-w-[120px]"
          >
            Try Again
          </Button>
          
          <Button
            variant="secondary"
            onClick={onReload}
            className="min-w-[120px]"
          >
            Reload Page
          </Button>
        </div>

        {/* Error Details Toggle */}
        {showDetails && (error || errorInfo) && (
          <div className="text-left">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDetailsVisible(!detailsVisible)}
              className="mb-4 text-gray-500"
            >
              {detailsVisible ? 'Hide Details' : 'Show Details'}
              <svg
                className={`ml-2 w-4 h-4 transform transition-transform ${
                  detailsVisible ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>

            {detailsVisible && (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-sm text-left">
                {error && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Error:</h3>
                    <pre className="whitespace-pre-wrap text-danger-600 bg-danger-50 p-2 rounded border">
                      {error.toString()}
                    </pre>
                  </div>
                )}

                {errorInfo && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Stack Trace:</h3>
                    <pre className="whitespace-pre-wrap text-xs text-gray-700 bg-gray-50 p-2 rounded border max-h-40 overflow-y-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for error boundary functionality in functional components
export const useErrorHandler = () => {
  return React.useCallback((error: Error) => {
    // This will cause the nearest error boundary to catch the error
    throw error;
  }, []);
};

// Async error boundary for handling async errors
export const useAsyncError = () => {
  const [, setError] = React.useState();
  return React.useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    [],
  );
};

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Error boundary for specific sections
export const SectionErrorBoundary: React.FC<{
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}> = ({ children, title = 'Section Error', description, className }) => {
  return (
    <ErrorBoundary
      className={className}
      fallback={
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-danger-900 mb-2">{title}</h3>
          {description && <p className="text-danger-700">{description}</p>}
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;