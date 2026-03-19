'use client';
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-bg-primary">
          <div className="glass-heavy rounded-2xl p-8 max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-red/10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Map Error</h2>
            <p className="text-sm text-text-secondary mb-4">The map encountered an issue. This usually resolves on reload.</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); }}
              className="rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity cursor-pointer"
            >
              Reload Map
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
