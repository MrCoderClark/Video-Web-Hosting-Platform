"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { apiFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { Film, Upload, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string | null;
  status: string;
  original_filename: string | null;
  original_size_bytes: number | null;
  thumbnail_url: string | null;
  created_at: string | null;
}

interface VideoListResponse {
  videos: Video[];
  total: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  uploading: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />,
    label: "Uploading",
    color: "text-warning",
  },
  queued: {
    icon: <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />,
    label: "Queued",
    color: "text-text-muted",
  },
  processing: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />,
    label: "Processing",
    color: "text-accent-indigo",
  },
  ready: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />,
    label: "Ready",
    color: "text-success",
  },
  error: {
    icon: <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} />,
    label: "Error",
    color: "text-error",
  },
};

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<VideoListResponse>("/api/videos")
      .then((data) => {
        setVideos(data.videos);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // SSE: real-time status updates
  useEffect(() => {
    let cancelled = false;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    async function connectSSE() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || cancelled) return;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8007";
      const url = `${backendUrl}/api/videos/status/stream`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok || !response.body || cancelled) return;

      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const chunk of lines) {
          const dataLine = chunk.replace(/^data: /, "").trim();
          if (!dataLine) continue;
          try {
            const update = JSON.parse(dataLine);
            setVideos((prev) =>
              prev.map((v) =>
                v.id === update.id
                  ? { ...v, status: update.status, thumbnail_url: update.thumbnail_url }
                  : v
              )
            );
          } catch {}
        }
      }
    }

    connectSSE();
    return () => {
      cancelled = true;
      reader?.cancel();
    };
  }, []);

  return (
    <>
      <Navbar />
      <div className="pt-16 px-6">
        <div className="mx-auto max-w-7xl py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-semibold">Dashboard</h1>
              <p className="mt-1 text-text-secondary">
                Manage your uploaded videos.
              </p>
            </div>
            <Link
              href="/upload"
              className="flex items-center gap-2 rounded-lg bg-accent-indigo px-4 py-2 text-sm font-medium text-white hover:bg-accent-indigo-hover shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all active:scale-[0.97]"
            >
              <Upload className="h-4 w-4" strokeWidth={1.5} />
              Upload
            </Link>
          </div>

          {/* Loading */}
          {loading && (
            <div className="mt-16 flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
              <p className="text-sm text-text-muted">Loading videos...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-8 rounded-xl border border-error/20 bg-error/5 p-4">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && videos.length === 0 && (
            <div className="mt-16 flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-elevated">
                <Film className="h-8 w-8 text-text-muted" strokeWidth={1.5} />
              </div>
              <p className="text-text-secondary">No videos yet</p>
              <Link
                href="/upload"
                className="text-sm text-accent-indigo hover:text-accent-indigo-hover transition-colors"
              >
                Upload your first video
              </Link>
            </div>
          )}

          {/* Video list */}
          {!loading && videos.length > 0 && (
            <div className="mt-8 space-y-3">
              {videos.map((video) => {
                const status = statusConfig[video.status] || statusConfig.queued;
                return (
                  <div
                    key={video.id}
                    className="flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-surface p-4 transition-colors hover:border-border-focus"
                  >
                    {/* Thumbnail placeholder */}
                    <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        <Film className="h-6 w-6 text-text-muted" strokeWidth={1.5} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {video.title}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                        {video.original_size_bytes && (
                          <span>{formatFileSize(video.original_size_bytes)}</span>
                        )}
                        {video.created_at && (
                          <span>{formatTimeAgo(video.created_at)}</span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className={`flex items-center gap-1.5 text-xs ${status.color}`}>
                      {status.icon}
                      {status.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
