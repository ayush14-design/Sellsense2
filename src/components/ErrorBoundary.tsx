import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndLogin = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('sellsense_user');
      localStorage.removeItem('sellsense_is_authenticated');
    } catch {}
    window.location.href = '/login';
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <ShieldAlert size={32} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-white tracking-tight mb-2">
                Application Recovered
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                SellSense encountered a temporary rendering issue. Your data is safe. Click below to reload or return to the sign-in screen.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-left text-xs font-mono text-rose-300 max-h-32 overflow-y-auto break-all">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-lime-400 hover:bg-lime-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg shadow-lime-400/20"
              >
                <RefreshCw size={16} />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearAndLogin}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs sm:text-sm border border-slate-700 transition"
              >
                <Home size={16} />
                <span>Reset Session & Return to Login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
