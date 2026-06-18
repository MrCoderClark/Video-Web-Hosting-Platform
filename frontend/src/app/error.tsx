"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-deep px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10 border border-error/20">
          <AlertCircle className="h-8 w-8 text-error" strokeWidth={1.5} />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent-indigo px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-indigo/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
          Try again
        </button>
      </div>
    </div>
  );
}
