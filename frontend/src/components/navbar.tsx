"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Play, Upload, LogOut, User, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border-subtle bg-bg-deep/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-indigo/10 group-hover:bg-accent-indigo/20 transition-colors">
            <Play className="h-4 w-4 text-accent-indigo" strokeWidth={1.5} fill="currentColor" />
          </div>
          <span className="font-heading text-lg font-semibold text-text-primary">
            VideoHost
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/upload"
                className="flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-text-secondary hover:border-border-focus hover:text-text-primary transition-all"
              >
                <Upload className="h-4 w-4" strokeWidth={1.5} />
                Upload
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center rounded-full outline-none focus:ring-2 focus:ring-accent-indigo/50">
                    <Avatar className="h-8 w-8 border border-border-subtle">
                      <AvatarFallback className="bg-bg-elevated text-text-secondary text-xs">
                        {user.email?.charAt(0).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-bg-surface border-border-subtle"
                >
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => router.push("/dashboard")}
                  >
                    <User className="h-4 w-4" strokeWidth={1.5} />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => router.push("/settings")}
                  >
                    <Settings className="h-4 w-4" strokeWidth={1.5} />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border-subtle" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 cursor-pointer text-error"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.5} />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-4 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-accent-indigo px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-indigo-hover shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all active:scale-[0.97]"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
