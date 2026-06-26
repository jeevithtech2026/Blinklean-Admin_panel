import React, { Component } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details to local/production telemetry systems
    console.error('[ErrorBoundary Catch]', error, errorInfo);
  }

  handleReset = () => {
    // Reset state to clear rendering locks, then reload page
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Premium clean error recovery screen styled with Tailwind CSS
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full rounded-2xl border border-slate-100 bg-white p-8 shadow-lg text-center space-y-6">
            <div className="flex justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 shadow-sm animate-pulse">
                <AlertOctagon className="h-8 w-8" />
              </span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Something went wrong</h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                The application encountered an uncaught runtime rendering error. 
                Please reload the interface or check console telemetry.
              </p>
            </div>

            {this.state.error && (
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-left">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">
                  Error Details
                </span>
                <code className="text-xs font-mono text-rose-700 break-all leading-normal block max-h-24 overflow-y-auto">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 text-sm font-semibold transition-all shadow-md hover:shadow-lg focus:outline-none cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Reset & Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
