import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0C0F1A] px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-[#F87171]/15 flex items-center justify-center text-[#F87171] mx-auto mb-6 border border-[#F87171]/20">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-3 tracking-tight">
              Something went wrong
            </h1>
            <p className="text-[#94A3B8] mb-8 leading-relaxed">
              An unexpected error occurred. Please try refreshing the page or going back to the home page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => window.location.reload()} className="gap-2">
                <RefreshCw size={16} /> Refresh Page
              </Button>
              <Button variant="secondary" onClick={this.handleReset} className="gap-2">
                Go to Home
              </Button>
            </div>
            {this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-xs text-[#6B7280] cursor-pointer hover:text-[#94A3B8] transition-colors">
                  Error details (for developers)
                </summary>
                <pre className="mt-2 text-xs text-[#F87171]/70 bg-[#141828] border border-white/[0.06] rounded-xl p-4 overflow-x-auto font-mono">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
