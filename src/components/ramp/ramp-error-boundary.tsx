/**
 * RAMP Error Boundary Component
 * 
 * Enhanced error boundary specifically for RAMP Network components
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { 
  AlertTriangle, 
  RefreshCw, 
  Bug, 
  ExternalLink, 
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface RampErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
  showDetails: boolean;
}

interface RampErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Whether to show detailed error information */
  showDetails?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Whether to show report bug button */
  showReportBug?: boolean;
  /** Bug report URL */
  bugReportUrl?: string;
  /** Component name for error tracking */
  componentName?: string;
}

class RampErrorBoundary extends Component<RampErrorBoundaryProps, RampErrorBoundaryState> {
  constructor(props: RampErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: props.showDetails || false
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<RampErrorBoundaryState> {
    // Generate unique error ID
    const errorId = `ramp-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to console
    console.error('RAMP Error Boundary caught an error:', error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
    
    // Report to error tracking service (e.g., Sentry)
    this.reportError(error, errorInfo);
  }
  
  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error details for debugging
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      componentName: this.props.componentName || 'RampComponent',
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.group('🚨 RAMP Network Error Report');
    console.error('Error ID:', errorDetails.errorId);
    console.error('Component:', errorDetails.componentName);
    console.error('Message:', errorDetails.message);
    console.error('Stack:', errorDetails.stack);
    console.error('Component Stack:', errorDetails.componentStack);
    console.groupEnd();
    
    // Here you would typically send to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorDetails });
  };
  
  private retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };
  
  private copyErrorDetails = async () => {
    const errorDetails = this.getErrorDetails();
    
    try {
      await navigator.clipboard.writeText(errorDetails);
      // You might want to show a toast here
      console.log('Error details copied to clipboard');
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };
  
  private getErrorDetails = (): string => {
    const { error, errorInfo, errorId } = this.state;
    const { componentName } = this.props;
    
    return `
RAMP Network Error Report
========================
Error ID: ${errorId}
Component: ${componentName || 'Unknown'}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Error Message:
${error?.message || 'Unknown error'}

Error Stack:
${error?.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}
    `.trim();
  };
  
  private reportBug = () => {
    const { bugReportUrl } = this.props;
    const errorDetails = this.getErrorDetails();
    
    if (bugReportUrl) {
      const url = new URL(bugReportUrl);
      url.searchParams.set('error_id', this.state.errorId);
      url.searchParams.set('error_details', errorDetails);
      window.open(url.toString(), '_blank');
    }
  };
  
  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };
  
  render() {
    const { hasError, error, errorId } = this.state;
    const { 
      children, 
      fallback, 
      errorMessage, 
      showRetry = true, 
      showReportBug = true,
      componentName = 'RAMP Component'
    } = this.props;
    
    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.state.errorInfo!, this.retry);
      }
      
      // Default error UI
      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {componentName} Error
            </CardTitle>
            <CardDescription>
              An unexpected error occurred while loading this component.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Error Message */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage || error.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>
            
            {/* Error ID */}
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <span className="text-sm font-mono text-muted-foreground">
                Error ID: {errorId}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={this.copyErrorDetails}
                className="h-auto p-1"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Error Details */}
            <Collapsible>
              <CollapsibleTrigger
                onClick={this.toggleDetails}
                className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Show technical details</span>
                {this.state.showDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="p-3 bg-muted rounded-md">
                  <div className="space-y-2 text-xs font-mono">
                    <div>
                      <span className="font-semibold">Error:</span> {error.message}
                    </div>
                    {error.stack && (
                      <div>
                        <span className="font-semibold">Stack:</span>
                        <pre className="mt-1 whitespace-pre-wrap text-xs overflow-x-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <span className="font-semibold">Component Stack:</span>
                        <pre className="mt-1 whitespace-pre-wrap text-xs overflow-x-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              {showRetry && (
                <Button
                  onClick={this.retry}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              {showReportBug && (
                <Button
                  variant="outline"
                  onClick={this.reportBug}
                  className="flex-1"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Report Bug
                </Button>
              )}
            </div>
            
            {/* Helpful Information */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p>If this error persists, try:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Refreshing the page</li>
                <li>Clearing your browser cache</li>
                <li>Checking your internet connection</li>
                <li>Trying again in a few minutes</li>
              </ul>
            </div>
            
            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge variant="outline" className="text-xs">
                RAMP Network Integration Error
              </Badge>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return children;
  }
}

// Hook for functional components to catch async errors
export function useRampErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`RAMP Error${context ? ` (${context})` : ''}:`, error);
    
    // You could dispatch this to a global error state or error reporting service
    throw error; // Re-throw to trigger error boundary
  }, []);
  
  return handleError;
}

// Higher-order component wrapper
export function withRampErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<RampErrorBoundaryProps>
) {
  const WrappedComponent = (props: P) => (
    <RampErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </RampErrorBoundary>
  );
  
  WrappedComponent.displayName = `withRampErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default RampErrorBoundary;
