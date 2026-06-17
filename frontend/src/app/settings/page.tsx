"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/client";
import { User, Save, Loader2, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        setDisplayName(user.user_metadata?.display_name || "");
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });
      if (updateError) throw updateError;

      // Also update profiles table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .schema("videohost" as any)
          .from("profiles")
          .update({ display_name: displayName })
          .eq("id", user.id);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="mx-auto max-w-2xl px-6 py-12">
          <h1 className="font-heading text-3xl font-semibold text-text-primary">Settings</h1>
          <p className="mt-2 text-text-secondary">
            Manage your account and profile.
          </p>

          {loading ? (
            <div className="mt-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" strokeWidth={1.5} />
            </div>
          ) : (
            <div className="mt-10 space-y-8">
              {/* Profile section */}
              <section className="rounded-xl border border-border-subtle bg-bg-surface/50 p-6">
                <h2 className="font-heading text-lg font-medium text-text-primary flex items-center gap-2">
                  <User className="h-5 w-5 text-text-muted" strokeWidth={1.5} />
                  Profile
                </h2>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-indigo focus:outline-none focus:ring-2 focus:ring-accent-indigo/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full rounded-lg border border-border-subtle bg-bg-elevated/50 px-3 py-2.5 text-sm text-text-muted cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-text-muted">Email cannot be changed here.</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent-indigo px-4 py-2 text-sm font-medium text-white hover:bg-accent-indigo/90 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                    ) : (
                      <Save className="h-4 w-4" strokeWidth={1.5} />
                    )}
                    Save changes
                  </button>
                  {success && (
                    <span className="flex items-center gap-1.5 text-sm text-success">
                      <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
                      Saved
                    </span>
                  )}
                  {error && (
                    <span className="text-sm text-error">{error}</span>
                  )}
                </div>
              </section>

              {/* Account info */}
              <section className="rounded-xl border border-border-subtle bg-bg-surface/50 p-6">
                <h2 className="font-heading text-lg font-medium text-text-primary">Account</h2>
                <p className="mt-2 text-sm text-text-muted">
                  To change your password or delete your account, use the Supabase auth management tools.
                </p>
              </section>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
