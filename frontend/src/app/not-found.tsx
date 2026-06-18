import Link from "next/link";
import { Film } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-deep px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-surface border border-border-subtle">
          <Film className="h-8 w-8 text-text-muted" strokeWidth={1.5} />
        </div>
        <h1 className="font-heading text-4xl font-bold text-text-primary">404</h1>
        <p className="mt-3 text-sm text-text-muted">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent-indigo px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-indigo/90 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
