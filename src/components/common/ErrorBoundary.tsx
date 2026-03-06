"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-red-50 p-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#0D1B2A]">
              Une erreur est survenue
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              {this.state.error?.message || "Erreur inattendue"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00]/5">
            Réessayer
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
