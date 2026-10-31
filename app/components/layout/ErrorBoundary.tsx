import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Route error boundary caught:", error, info.componentStack);
  }

  private readonly handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="container-page py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl">This page hit an unexpected error</h1>
        <p className="mt-4 max-w-xl text-lg text-foreground-muted">{error.message}</p>
        <button
          type="button"
          onClick={this.handleReset}
          className="mt-8 rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-gold-300"
        >
          Try again
        </button>
      </div>
    );
  }
}
