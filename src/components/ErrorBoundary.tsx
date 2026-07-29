// ============================================================
// TrafficWatch AI — ErrorBoundary
//
// Class-based React error boundary that catches render errors
// and displays a user-friendly fallback with recovery actions.
// Should be used to wrap route-level components.
// ============================================================

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional user-friendly name for the component/page that crashed */
  componentName?: string;
  /** Optional callback fired when error is caught (for logging) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
  /** Whether to show the stack trace in development */
  showStack?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    console.error(
      `[ErrorBoundary${this.props.componentName ? `:${this.props.componentName}` : ""}]`,
      error.message,
      errorInfo.componentStack
    );
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = (): void => {
    this.handleReset();
    window.location.href = "/dashboard";
  };

  handleGoBack = (): void => {
    this.handleReset();
    window.history.back();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;

      return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4" role="alert">
          <Card className="clay-card border-border/50 !rounded-2xl max-w-lg w-full">
            <CardContent className="p-8 space-y-6">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8 text-destructive" />
              </div>

              {/* Title & Message */}
              <div className="text-center space-y-2">
                <h1 className="text-xl font-bold text-foreground">
                  {this.props.componentName
                    ? `${this.props.componentName} Encountered an Error`
                    : "Something Went Wrong"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  The application encountered an unexpected error and could not continue.
                  This doesn't affect other parts of the system.
                </p>
              </div>

              {/* Error Details (collapsed, for support) */}
              {error && (
                <details className="group bg-secondary/30 rounded-xl p-3 cursor-pointer">
                  <summary className="text-xs font-medium text-muted-foreground group-open:text-foreground transition-colors">
                    Error Details (for support reference)
                  </summary>
                  <pre className="mt-2 text-[10px] leading-relaxed text-muted-foreground/80 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono bg-background/50 rounded-lg p-2">
                    {error.name}: {error.message}
                    {"\n\n"}
                    {this.state.errorInfo?.componentStack || ""}
                  </pre>
                </details>
              )}

              {/* Recovery Actions */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={this.handleGoBack}
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Go Back
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={this.handleGoHome}
                >
                  <Home className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Button>
                <Button
                  className="rounded-xl"
                  onClick={this.handleReset}
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Try Again
                </Button>
              </div>

              <p className="text-[10px] text-center text-muted-foreground/50">
                If this problem persists, please contact your system administrator
                and provide the error details above.
              </p>
            </CardContent>
          </Card>
        </main>
      );
    }

    return this.props.children;
  }
}
