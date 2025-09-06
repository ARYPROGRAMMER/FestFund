import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error!} reset={this.reset} />;
    }

    return this.props.children;
  }
}

interface ErrorDisplayProps {
  error: string | Error | null;
  retry?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'warning';
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  retry,
  className = '',
  variant = 'destructive',
}) => {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message;
  
  return (
    <Alert variant={variant} className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {retry && (
          <Button
            variant="outline"
            size="sm"
            onClick={retry}
            className="ml-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

interface LoadingStateProps {
  loading: boolean;
  error?: string | Error | null;
  retry?: () => void;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  retry,
  children,
  loadingComponent,
  errorComponent,
}) => {
  if (loading) {
    return (
      <>
        {loadingComponent || (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600/30 border-t-purple-600"></div>
            <span className="ml-3 text-gray-400">Loading...</span>
          </div>
        )}
      </>
    );
  }

  if (error) {
    return (
      <>
        {errorComponent || (
          <ErrorDisplay error={error} retry={retry} className="m-4" />
        )}
      </>
    );
  }

  return <>{children}</>;
};

interface ConnectionStatusProps {
  isOnline: boolean;
  lastSync?: Date | string;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isOnline,
  lastSync,
  className = '',
}) => {
  const syncDate = lastSync ? new Date(lastSync) : null;
  const syncText = syncDate 
    ? `Last sync: ${syncDate.toLocaleTimeString()}`
    : 'Never synced';

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
        {isOnline ? 'Connected' : 'Disconnected'}
      </span>
      {lastSync && (
        <span className="text-gray-500">• {syncText}</span>
      )}
    </div>
  );
};

const DefaultErrorFallback: React.FC<{ error: Error; reset: () => void }> = ({
  error,
  reset,
}) => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="max-w-md mx-auto p-6 text-center">
      <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
      <p className="text-gray-400 mb-4">{error.message}</p>
      <Button onClick={reset} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  </div>
);

export default ErrorBoundary;
