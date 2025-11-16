/**
 * Error Boundary and Recovery Component
 * Handles errors gracefully in Stories components
 */

'use client';

import React, { Component, ReactNode, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined') {
      // window.Sentry?.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
  onRetry: () => void;
  onReload: () => void;
  onGoHome: () => void;
  showDetails?: boolean;
}

function ErrorFallback({
  error,
  errorInfo,
  errorId,
  onRetry,
  onReload,
  onGoHome,
  showDetails = false
}: ErrorFallbackProps) {
  const [showFullError, setShowFullError] = useState(false);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <p className="text-gray-600">
            We encountered an unexpected error. Don't worry, your data is safe.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error ID for support */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Error ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{errorId}</code>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={onRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={onReload} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            <Button variant="outline" onClick={onGoHome} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>

          {/* Error details toggle */}
          {showDetails && error && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullError(!showFullError)}
                className="w-full flex items-center gap-2"
              >
                <Bug className="h-4 w-4" />
                {showFullError ? 'Hide' : 'Show'} Error Details
              </Button>

              {showFullError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="space-y-2">
                      <div>
                        <strong>Error:</strong> {error.message}
                      </div>
                      {error.stack && (
                        <details className="text-xs">
                          <summary className="cursor-pointer">Stack Trace</summary>
                          <pre className="mt-2 whitespace-pre-wrap bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                      {errorInfo?.componentStack && (
                        <details className="text-xs">
                          <summary className="cursor-pointer">Component Stack</summary>
                          <pre className="mt-2 whitespace-pre-wrap bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                            {errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Help text */}
          <div className="text-center text-sm text-gray-500">
            <p>
              If this problem persists, please contact support with the error ID above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook for handling async errors in components
 */
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error) => {
    console.error('Async error caught:', error);
    setError(error);
    
    // Report to error tracking
    if (typeof window !== 'undefined') {
      // window.Sentry?.captureException(error);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

/**
 * Higher-order component for wrapping components with error boundary
 */
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

/**
 * Stories-specific error boundary with custom fallback
 */
export function StoriesErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Custom error handling for Stories
        console.error('Stories Error:', error, errorInfo);
      }}
      fallback={
        <div className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Stories Error</h2>
          <p className="text-gray-600 mb-4">
            There was an error loading the Stories feature. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Network error handler for API calls
 */
export function handleApiError(error: any): string {
  if (error.name === 'NetworkError' || error.message === 'Failed to fetch') {
    return 'Network error. Please check your internet connection.';
  }
  
  if (error.status === 401) {
    return 'Authentication required. Please log in again.';
  }
  
  if (error.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.status === 404) {
    return 'The requested resource was not found.';
  }
  
  if (error.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  return error.message || 'An unexpected error occurred.';
}

/**
 * Retry mechanism for failed operations
 */
export function useRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(async (): Promise<T> => {
    setIsRetrying(true);
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        const result = await operation();
        setIsRetrying(false);
        setRetryCount(0);
        return result;
      } catch (error) {
        if (attempt === maxRetries) {
          setIsRetrying(false);
          setRetryCount(0);
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
    
    throw new Error('Max retries exceeded');
  }, [operation, maxRetries, delay]);

  return { retry, isRetrying, retryCount };
}