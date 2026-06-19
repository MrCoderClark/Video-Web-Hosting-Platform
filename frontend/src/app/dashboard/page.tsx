"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { apiFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import {
  Film, Upload, Clock, CheckCircle2, AlertCircle, Loader2,
  Pencil, Trash2, X, Check, ExternalLink, Eye, EyeOff, Globe, Link2, ImagePlus,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8007";

interface Video {
  id: string;
  title: string;
  description: string | null;
  status: string;
  visibility: string;
  original_filename: string | null;
  original_size_bytes: number | null;
  thumbnail_url: string | null;
  view_count: number;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [uploadingThumbId, setUploadingThumbId] = useState<string | null>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const thumbTargetId = useRef<string | null>(null);

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

  const startEdit = (video: Video) => {
    setEditingId(video.id);
    setEditTitle(video.title);
    setEditDescription(video.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const updated = await apiFetch<Video>(`/api/videos/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      setVideos((prev) => prev.map((v) => (v.id === editingId ? { ...v, title: updated.title, description: updated.description } : v)));
      cancelEdit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async (id: string) => {
    setDeletingId(id);
    try {
      await apiFetch(`/api/videos/${id}`, { method: "DELETE" });
      setVideos((prev) => prev.filter((v) => v.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const cycleVisibility = async (video: Video) => {
    const order = ["public", "unlisted", "private"];
    const next = order[(order.indexOf(video.visibility) + 1) % order.length];
    try {
      await apiFetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next }),
      });
      setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, visibility: next } : v)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const videoId = thumbTargetId.current;
    if (!file || !videoId) return;
    e.target.value = "";

    setUploadingThumbId(videoId);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${BACKEND_URL}/api/videos/${videoId}/thumbnail`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(body.detail);
      }

      const data = await res.json();
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, thumbnail_url: data.thumbnail_url } : v))
      );
      toast.success("Thumbnail updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload thumbnail");
    } finally {
      setUploadingThumbId(null);
    }
  };

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
      <input
        ref={thumbInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleThumbnailUpload}
      />
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
                const statusCfg = statusConfig[video.status] || statusConfig.queued;
                const isEditing = editingId === video.id;
                const isConfirmingDelete = confirmDeleteId === video.id;
                const isDeleting = deletingId === video.id;

                return (
                  <div
                    key={video.id}
                    className="rounded-xl border border-border-subtle bg-bg-surface p-4 transition-colors hover:border-border-focus"
                  >
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="relative group/thumb h-16 w-28 shrink-0">
                        <Link
                          href={video.status === "ready" ? `/watch/${video.id}` : "#"}
                          className="flex h-full w-full items-center justify-center rounded-lg bg-bg-elevated overflow-hidden"
                        >
                          {video.thumbnail_url ? (
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="h-full w-full rounded-lg object-cover"
                            />
                          ) : (
                            <Film className="h-6 w-6 text-text-muted" strokeWidth={1.5} />
                          )}
                        </Link>
                        {video.status === "ready" && (
                          <button
                            onClick={() => {
                              thumbTargetId.current = video.id;
                              thumbInputRef.current?.click();
                            }}
                            disabled={uploadingThumbId === video.id}
                            className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity cursor-pointer"
                            title="Change thumbnail"
                          >
                            {uploadingThumbId === video.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-white" strokeWidth={1.5} />
                            ) : (
                              <ImagePlus className="h-4 w-4 text-white" strokeWidth={1.5} />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full rounded-md border border-border-subtle bg-bg-elevated px-2 py-1 text-sm text-text-primary focus:border-accent-indigo focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <p className="truncate text-sm font-medium text-text-primary">
                            {video.title}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                          {video.original_size_bytes && (
                            <span>{formatFileSize(video.original_size_bytes)}</span>
                          )}
                          {video.created_at && (
                            <span>{formatTimeAgo(video.created_at)}</span>
                          )}
                          {video.status === "ready" && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" strokeWidth={1.5} />
                              {video.view_count}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visibility toggle */}
                      {video.status === "ready" && (
                        <button
                          onClick={() => cycleVisibility(video)}
                          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs shrink-0 border border-border-subtle hover:border-border-focus transition-colors"
                          title={`Visibility: ${video.visibility} (click to change)`}
                        >
                          {video.visibility === "public" && <Globe className="h-3.5 w-3.5 text-success" strokeWidth={1.5} />}
                          {video.visibility === "unlisted" && <Link2 className="h-3.5 w-3.5 text-warning" strokeWidth={1.5} />}
                          {video.visibility === "private" && <EyeOff className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.5} />}
                          <span className="text-text-secondary capitalize">{video.visibility}</span>
                        </button>
                      )}

                      {/* Status badge */}
                      <div className={`flex items-center gap-1.5 text-xs shrink-0 ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {video.status === "ready" && (
                          <Link
                            href={`/watch/${video.id}`}
                            className="rounded-md p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                            title="Watch"
                          >
                            <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                          </Link>
                        )}

                        {isEditing ? (
                          <>
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="rounded-md p-1.5 text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                              title="Save"
                            >
                              {saving ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} /> : <Check className="h-4 w-4" strokeWidth={1.5} />}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="rounded-md p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(video)}
                              className="rounded-md p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={1.5} />
                            </button>

                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => deleteVideo(video.id)}
                                  disabled={isDeleting}
                                  className="rounded-md px-2 py-1 text-xs bg-error text-white hover:bg-error/80 transition-colors disabled:opacity-50"
                                >
                                  {isDeleting ? "..." : "Delete"}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="rounded-md p-1.5 text-text-muted hover:text-text-primary transition-colors"
                                >
                                  <X className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(video.id)}
                                className="rounded-md p-1.5 text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Edit description (expanded row) */}
                    {isEditing && (
                      <div className="mt-3 pl-32">
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description (optional)"
                          rows={2}
                          className="w-full rounded-md border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-indigo focus:outline-none resize-none"
                        />
                      </div>
                    )}
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
