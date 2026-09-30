import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SeismoBench ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-mono">
          <div className="max-w-2xl w-full bg-slate-900 border border-rose-800/80 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <AlertOctagon className="w-8 h-8 shrink-0 text-rose-500" />
              <div>
                <h1 className="text-lg font-bold">SeismoBench Runtime Recovery</h1>
                <p className="text-xs text-slate-400">An unexpected exception was caught in the component tree.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs text-rose-300 overflow-x-auto mb-4 font-mono">
              <p className="font-bold mb-1">{this.state.error?.toString()}</p>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[11px] text-slate-500 whitespace-pre-wrap mt-2">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-cyan-600/20"
            >
              <RotateCcw className="w-4 h-4" />
              Reset & Reload SeismoBench
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
