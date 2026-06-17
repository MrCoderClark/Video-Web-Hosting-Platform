"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { VideoPlayer } from "@/components/video-player";
import { Loader2, Calendar, Monitor, User as UserIcon, Eye } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8007";

interface VideoDetail {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  view_count: number;
  uploader_name: string | null;
  created_at: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatResolution(w: number | null, h: number | null): string {
  if (!w || !h) return "";
  if (h >= 1080) return "1080p";
  if (h >= 720) return "720p";
  if (h >= 480) return "480p";
  return `${h}p`;
}

export default function WatchPage() {
  const params = useParams<{ id: string }>();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    fetch(`${BACKEND_URL}/api/public/videos/${params.id}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({ detail: "Video not found" }));
          throw new Error(body.detail);
        }
        return res.json();
      })
      .then((data) => setVideo(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const hlsSrc = video ? `${BACKEND_URL}/api/public/videos/${video.id}/hls/master.m3u8` : "";

  return (
    <>
      <Navbar />
      <div className="pt-16">
        {/* Loading */}
        {loading && (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" strokeWidth={1.5} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-auto max-w-3xl px-6 pt-12">
            <div className="rounded-xl border border-error/20 bg-error/5 p-6 text-center">
              <p className="text-error">{error}</p>
            </div>
          </div>
        )}

        {/* Video */}
        {video && (
          <>
            {/* Player — full width, edge-to-edge, video is the hero (DESIGN.md) */}
            <div className="bg-black">
              <div className="mx-auto max-w-[1200px]">
                <VideoPlayer
                  src={hlsSrc}
                  poster={video.thumbnail_url || undefined}
                  videoId={video.id}
                />
              </div>
            </div>

            {/* Video info — spacious, cinematic layout */}
            <div className="mx-auto max-w-[1200px] px-6 py-8 sm:py-10">
              <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-text-primary leading-tight">
                {video.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-text-secondary">
                {video.uploader_name && (
                  <span className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-elevated">
                      <UserIcon className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.5} />
                    </div>
                    <span className="font-medium text-text-primary">{video.uploader_name}</span>
                  </span>
                )}
                {video.created_at && (
                  <span className="flex items-center gap-1.5 text-text-muted">
                    <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {formatDate(video.created_at)}
                  </span>
                )}
                {video.width && video.height && (
                  <span className="flex items-center gap-1.5 text-text-muted">
                    <Monitor className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {formatResolution(video.width, video.height)}
                  </span>
                )}
                {video.view_count > 0 && (
                  <span className="flex items-center gap-1.5 text-text-muted">
                    <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {video.view_count.toLocaleString()} view{video.view_count !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {video.description && (
                <div className="mt-6 rounded-xl border border-border-subtle bg-bg-surface/50 p-5 sm:p-6">
                  <p className="whitespace-pre-wrap text-[15px] text-text-secondary leading-relaxed">
                    {video.description}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
