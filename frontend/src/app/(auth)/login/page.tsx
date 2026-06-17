"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-indigo/10">
            <Play className="h-6 w-6 text-accent-indigo" strokeWidth={1.5} fill="currentColor" />
          </div>
          <h1 className="font-heading text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-text-secondary">
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-secondary text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-bg-elevated border-border-subtle focus:border-accent-indigo placeholder:text-text-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-text-secondary text-sm">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-bg-elevated border-border-subtle focus:border-accent-indigo placeholder:text-text-muted"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-indigo hover:bg-accent-indigo-hover text-white shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all active:scale-[0.97]"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-accent-indigo hover:text-accent-indigo-hover transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
