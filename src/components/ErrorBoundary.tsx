import { Component, ReactNode } from "react";

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Unhandled UI error:", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex w-full h-screen items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm opacity-70 mb-4">
            Your notes are saved. Reload to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-accent text-white cursor-pointer"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
