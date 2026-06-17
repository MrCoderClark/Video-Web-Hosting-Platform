"use client";

import Link from "next/link";
import { Film, Play } from "lucide-react";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  uploaderName: string | null;
  createdAt: string | null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function VideoCard({
  id,
  title,
  thumbnailUrl,
  durationSeconds,
  uploaderName,
  createdAt,
}: VideoCardProps) {
  return (
    <Link href={`/watch/${id}`} className="group block">
      {/* Thumbnail — no border at rest, appears on hover (DESIGN.md) */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-bg-elevated border border-transparent transition-all duration-150 group-hover:border-border-focus group-hover:scale-[1.02] group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg-surface">
            <Film className="h-10 w-10 text-text-muted" strokeWidth={1.5} />
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-200 opacity-0 group-hover:opacity-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <Play className="h-4 w-4 text-bg-deep ml-0.5" strokeWidth={2} fill="currentColor" />
          </div>
        </div>

        {/* Duration badge — bottom right */}
        {durationSeconds != null && durationSeconds > 0 && (
          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums backdrop-blur-sm">
            {formatDuration(durationSeconds)}
          </div>
        )}
      </div>

      {/* Info — title, uploader, time ago */}
      <div className="mt-3 px-0.5">
        <h3 className="line-clamp-1 text-[15px] font-medium text-text-primary group-hover:text-white transition-colors">
          {title}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-text-secondary">
          {uploaderName && <span className="text-text-secondary">{uploaderName}</span>}
          {uploaderName && createdAt && <span className="text-text-muted">·</span>}
          {createdAt && <span className="text-text-muted">{formatTimeAgo(createdAt)}</span>}
        </div>
      </div>
    </Link>
  );
}
