import { Navbar } from "@/components/navbar";
import { Play } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] pt-16 px-6">
        <div className="max-w-2xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-indigo/10">
              <Play className="h-8 w-8 text-accent-indigo" strokeWidth={1.5} fill="currentColor" />
            </div>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight">
            Your videos,{" "}
            <span className="text-accent-indigo">cinema-grade.</span>
          </h1>

          <p className="text-lg text-text-secondary max-w-lg mx-auto">
            Upload, transcode, and stream your videos in stunning quality.
            Ad-free, self-hosted, and entirely yours.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="rounded-lg bg-accent-indigo px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-indigo-hover shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all active:scale-[0.97]"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-border-subtle px-6 py-2.5 text-sm text-text-secondary hover:border-border-focus hover:text-text-primary transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
