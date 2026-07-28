import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorRecoveryUI from './ErrorRecoveryUI';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Called when an error is caught so the parent can clean up state (e.g. session snapshots). */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  /** Whether the user has already clicked "清除数据并重置" and is now confirming. */
  confirmingReset: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, confirmingReset: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ errorInfo: info });
    this.props.onError?.(error, info);
    // Log diagnostic info to console only — no data upload
    console.error('[ErrorBoundary]', {
      message: error.message,
      name: error.name,
      timestamp: new Date().toISOString(),
      componentStack: info.componentStack ?? '(unavailable)',
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    // First click: ask for confirmation before clearing all local data
    this.setState({ confirmingReset: true });
  };

  handleConfirmReset = (): void => {
    // Clear all app-related localStorage keys to ensure a clean slate
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('kegel.')) {
        localStorage.removeItem(key);
      }
    }
    window.location.reload();
  };

  handleCancelReset = (): void => {
    this.setState({ confirmingReset: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <ErrorRecoveryUI
          message={isDev ? this.state.error?.message : undefined}
          stack={isDev ? this.state.errorInfo?.componentStack : undefined}
          onReload={this.handleReload}
          onReset={this.handleReset}
          confirmingReset={this.state.confirmingReset}
          onConfirmReset={this.handleConfirmReset}
          onCancelReset={this.handleCancelReset}
        />
      );
    }

    return this.props.children;
  }
}
