import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Render prop for custom fallback with retry. Takes precedence over fallback. */
  fallbackRender?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallbackRender) {
        return this.props.fallbackRender(
          this.state.error,
          this.handleRetry,
        );
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-muted p-6">
          <Card className="max-w-md shadow-lg">
            <CardHeader>
              <h2 className="text-lg font-semibold text-red-600">
                Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground">
                {this.state.error.message}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={this.handleRetry}>
                Try again
              </Button>
              <p className="text-xs text-muted-foreground">
                If the problem persists, try refreshing the page or contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
