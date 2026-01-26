import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Unhandled UI error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
          <div className="mb-4 text-2xl font-semibold">Something went wrong</div>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            {this.state.message || "An unexpected error occurred. Please try reloading the page."}
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-md bg-foreground px-4 py-2 text-background shadow-sm transition hover:bg-foreground/90"
          >
            Reload app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
