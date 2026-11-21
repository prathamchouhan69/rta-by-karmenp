import React, { Component, ErrorInfo, ReactNode } from 'react';
import { IconAlert } from './Icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('KARM OS Uncaught Runtime Boundary Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#05070a] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full p-8 rounded-3xl bg-[#090d15] border border-cyan-500/30 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,242,254,0.3)]">
              <IconAlert size={28} />
            </div>
            <h2 className="type-h2 text-white">Cockpit Boundary Isolated</h2>
            <p className="type-body-sm text-slate-400">
              A runtime anomaly was isolated by the RTA by KARM protective boundary. Your offline database and Zoho Books staging queue are secure.
            </p>
            <div className="p-3 bg-black/60 rounded-xl border border-white/5 font-numeric text-xs text-rose-300 text-left overflow-x-auto">
              {this.state.error?.message || 'Unknown runtime error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold type-button text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(0,242,254,0.3)]"
            >
              Restart Cockpit
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
