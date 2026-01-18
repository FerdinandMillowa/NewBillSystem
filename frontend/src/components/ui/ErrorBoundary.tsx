import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Card } from "./Card";
import { Button } from "./Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("❌ ErrorBoundary caught an error:", error, errorInfo);
    console.error("❌ Component:", this.props.componentName || "Unknown");
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Component stack:", errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-500 bg-red-50">
          <div className="p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              ⚠️ Component Error
            </h2>

            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Component:</strong>{" "}
                {this.props.componentName || "Unknown"}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Error:</strong> {this.state.error?.message}
              </p>
            </div>

            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                Error Details (click to expand)
              </summary>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-60">
                <pre>{this.state.error?.stack}</pre>
              </div>
            </details>

            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                Component Stack (click to expand)
              </summary>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-60">
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </div>
            </details>

            <div className="flex space-x-3">
              <Button onClick={this.handleReset}>Try Again</Button>
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
