import { Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Uncaught render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-gray-600">
            Sorry about that — please refresh the page to keep going.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-accent px-5 py-2.5 text-lg text-white transition-colors hover:bg-accent-dark"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
