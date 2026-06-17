"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { VideoCard } from "@/components/video-card";
import { Film, Search, X, Play, ChevronLeft, ChevronRight } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8007";

interface BrowseVideo {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  uploader_name: string | null;
  created_at: string | null;
}

// ── Horizontal scroll row with arrows ──
function VideoRow({ title, videos }: { title: string; videos: BrowseVideo[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  useEffect(() => {
    checkScroll();
  }, [videos]);

  return (
    <div className="relative group/row">
      <h2 className="font-heading text-lg sm:text-xl font-semibold text-text-primary mb-4">
        {title}
      </h2>

      {/* Scroll arrows */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-[calc(50%+12px)] -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-bg-surface/90 border border-border-subtle shadow-lg backdrop-blur-sm opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-bg-elevated"
        >
          <ChevronLeft className="h-5 w-5 text-text-primary" strokeWidth={1.5} />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-[calc(50%+12px)] -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-bg-surface/90 border border-border-subtle shadow-lg backdrop-blur-sm opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-bg-elevated"
        >
          <ChevronRight className="h-5 w-5 text-text-primary" strokeWidth={1.5} />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {videos.map((v) => (
          <div key={v.id} className="flex-shrink-0 w-[280px] sm:w-[300px]">
            <VideoCard
              id={v.id}
              title={v.title}
              thumbnailUrl={v.thumbnail_url}
              durationSeconds={v.duration_seconds}
              uploaderName={v.uploader_name}
              createdAt={v.created_at}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [videos, setVideos] = useState<BrowseVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchVideos = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("limit", "50");
      const res = await fetch(`${BACKEND_URL}/api/public/videos?${params}`);
      const data = await res.json();
      setVideos(data.videos);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
    fetchVideos(searchInput || undefined);
  };

  const clearSearch = () => {
    setSearchInput("");
    setQuery("");
    fetchVideos();
  };

  const featured = videos.length > 0 ? videos[0] : null;
  const restVideos = videos.slice(1);

  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Loading */}
        {loading && (
          <div className="px-6 py-12">
            {/* Hero skeleton */}
            <div className="mx-auto max-w-[1400px]">
              <div className="aspect-[21/9] rounded-2xl bg-bg-elevated animate-pulse" />
              <div className="mt-8 flex gap-4 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[300px] space-y-3 animate-pulse">
                    <div className="aspect-video rounded-xl bg-bg-elevated" />
                    <div className="h-4 w-3/4 rounded bg-bg-elevated" />
                    <div className="h-3 w-1/2 rounded bg-bg-elevated" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content loaded */}
        {!loading && (
          <>
            {/* Featured Hero */}
            {featured && !query && (
              <section className="relative">
                <div className="relative mx-auto max-w-[1400px] px-6 pt-6">
                  <Link
                    href={`/watch/${featured.id}`}
                    className="group relative block aspect-[21/9] overflow-hidden rounded-2xl"
                  >
                    {/* Background image */}
                    {featured.thumbnail_url ? (
                      <img
                        src={featured.thumbnail_url}
                        alt={featured.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-bg-elevated to-bg-surface" />
                    )}

                    {/* Dark overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

                    {/* Content overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
                      <h2 className="font-heading text-2xl sm:text-4xl font-bold text-white leading-tight max-w-lg">
                        {featured.title}
                      </h2>
                      {featured.uploader_name && (
                        <p className="mt-2 text-sm sm:text-base text-white/70">
                          {featured.uploader_name}
                        </p>
                      )}
                      {featured.description && (
                        <p className="mt-2 text-sm text-white/60 line-clamp-2 max-w-md hidden sm:block">
                          {featured.description}
                        </p>
                      )}
                      <div className="mt-4">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black shadow-lg transition-transform group-hover:scale-105">
                          <Play className="h-4 w-4" strokeWidth={2} fill="currentColor" />
                          Watch
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              </section>
            )}

            {/* Search bar (below hero or at top when searching) */}
            <section className="mx-auto max-w-[1400px] px-6 pt-8">
              <div className="flex items-center gap-4">
                <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" strokeWidth={1.5} />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search videos..."
                    className="w-full rounded-full border border-border-subtle bg-bg-elevated py-2.5 pl-11 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-indigo focus:outline-none focus:ring-2 focus:ring-accent-indigo/20 transition-all"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
                      <X className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  )}
                </form>
                {query && (
                  <p className="text-sm text-text-muted">
                    {videos.length} result{videos.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </section>

            {/* Search results — grid */}
            {query && (
              <section className="mx-auto max-w-[1400px] px-6 py-8">
                {videos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-5">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-bg-surface border border-border-subtle">
                      <Film className="h-9 w-9 text-text-muted" strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                      <p className="text-text-primary font-medium">No videos match your search</p>
                      <p className="mt-1 text-sm text-text-muted">Try a different search term</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                    {videos.map((v) => (
                      <VideoCard
                        key={v.id}
                        id={v.id}
                        title={v.title}
                        thumbnailUrl={v.thumbnail_url}
                        durationSeconds={v.duration_seconds}
                        uploaderName={v.uploader_name}
                        createdAt={v.created_at}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Browse rows (non-search) */}
            {!query && restVideos.length > 0 && (
              <section className="mx-auto max-w-[1400px] px-6 py-8 space-y-10">
                <VideoRow title="Latest uploads" videos={restVideos} />
              </section>
            )}

            {/* Empty state (no videos at all) */}
            {!query && videos.length === 0 && (
              <section className="mx-auto max-w-[1400px] px-6 py-8">
                <div className="flex flex-col items-center justify-center py-24 gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-bg-surface border border-border-subtle">
                    <Film className="h-9 w-9 text-text-muted" strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <p className="text-text-primary font-medium">No videos yet</p>
                    <p className="mt-1 text-sm text-text-muted">Be the first to upload a video</p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
