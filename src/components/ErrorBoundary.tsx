import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '@utils/logger';
import { ServiceError } from '@utils/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log the error
    logError('Error Boundary caught an error', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      isServiceError: error instanceof ServiceError,
      errorCode: error instanceof ServiceError ? error.code : undefined
    });

    // Call the error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public componentDidUpdate(prevProps: Props) {
    // Reset the error state when props change if resetOnPropsChange is true
    if (
      this.props.resetOnPropsChange &&
      this.state.hasError &&
      prevProps !== this.props
    ) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary p-4 border rounded-lg bg-red-50 dark:bg-red-900">
          <h1 className="text-xl font-bold text-red-700 dark:text-red-200 mb-2">
            Something went wrong
          </h1>
          
          {this.state.error instanceof ServiceError ? (
            <div className="mb-4">
              <p className="text-red-600 dark:text-red-300">
                {this.state.error.message}
              </p>
              {this.state.error.code && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  Error Code: {this.state.error.code}
                </p>
              )}
            </div>
          ) : (
            <p className="text-red-600 dark:text-red-300 mb-4">
              {this.state.error?.toString() || 'An unexpected error occurred'}
            </p>
          )}

          <details className="mb-4">
            <summary className="cursor-pointer text-red-600 dark:text-red-300">
              Error Details
            </summary>
            <pre className="mt-2 p-2 bg-red-100 dark:bg-red-800 rounded text-sm overflow-auto">
              {this.state.error?.stack}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>

          <div className="flex gap-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
} 