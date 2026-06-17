"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
} from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  rounded?: boolean;
  videoId?: string;
}

const VIEW_THRESHOLD_SECONDS = 30;
const VIEW_THRESHOLD_PERCENT = 0.3;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8007";

export function VideoPlayer({ src, poster, autoPlay = false, rounded = false, videoId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const viewRecorded = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [levels, setLevels] = useState<{ height: number; index: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [showQuality, setShowQuality] = useState(false);

  // ── HLS setup ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const lvls = hls.levels.map((l, i) => ({ height: l.height, index: i }));
        setLevels(lvls);
        setCurrentLevel(-1);
        if (autoPlay) video.play().catch(() => {});
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentLevel(data.level);
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      if (autoPlay) video.play().catch(() => {});
    }
  }, [src, autoPlay]);

  // ── Video events ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => {
      setCurrentTime(video.currentTime);
      // View tracking: 30s OR 30% of video (whichever first)
      if (!viewRecorded.current && videoId && video.duration > 0) {
        const threshold = Math.min(VIEW_THRESHOLD_SECONDS, video.duration * VIEW_THRESHOLD_PERCENT);
        if (video.currentTime >= threshold) {
          viewRecorded.current = true;
          fetch(`${BACKEND_URL}/api/public/videos/${videoId}/view`, { method: "POST" }).catch(() => {});
        }
      }
    };
    const onDuration = () => setDuration(video.duration);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("durationchange", onDuration);
    video.addEventListener("progress", onProgress);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("durationchange", onDuration);
      video.removeEventListener("progress", onProgress);
    };
  }, []);

  // ── Controls visibility ──
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 2500);
  }, [playing]);

  useEffect(() => {
    if (!playing) setShowControls(true);
  }, [playing]);

  // ── Actions ──
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * duration;
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const setQuality = (index: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = index;
    setShowQuality(false);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative aspect-video w-full overflow-hidden bg-black group cursor-pointer ${rounded ? "rounded-xl" : ""}`}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-controls]")) return;
        togglePlay();
      }}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="h-full w-full object-contain"
        playsInline
      />

      {/* Big play button (center, when paused) */}
      {!playing && (
        <div
          data-controls
          className="absolute inset-0 flex items-center justify-center bg-black/30"
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        >
          <button className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-indigo/90 text-white shadow-[0_0_40px_rgba(99,102,241,0.3)] transition-transform hover:scale-110">
            <Play className="h-7 w-7 ml-1" strokeWidth={1.5} fill="currentColor" />
          </button>
        </div>
      )}

      {/* Bottom controls */}
      <div
        data-controls
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-3 pt-12 transition-opacity duration-200 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress bar */}
        <div
          className="group/bar relative mb-3 h-1 cursor-pointer rounded-full bg-white/20 hover:h-1.5 transition-all"
          onClick={seek}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/30"
            style={{ width: `${bufferedPct}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-accent-indigo"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-accent-indigo shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, transform: `translateX(-50%) translateY(-50%)` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="text-white hover:text-accent-indigo transition-colors">
            {playing ? (
              <Pause className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Play className="h-5 w-5" strokeWidth={1.5} fill="currentColor" />
            )}
          </button>

          <button onClick={toggleMute} className="text-white hover:text-accent-indigo transition-colors">
            {muted ? (
              <VolumeX className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Volume2 className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>

          <span className="text-xs text-white/70 tabular-nums select-none">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Quality selector */}
          {levels.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowQuality(!showQuality)}
                className="text-white hover:text-accent-indigo transition-colors"
              >
                <Settings className="h-5 w-5" strokeWidth={1.5} />
              </button>
              {showQuality && (
                <div className="absolute bottom-8 right-0 w-32 rounded-lg border border-border-subtle bg-bg-surface p-1 shadow-xl">
                  <button
                    onClick={() => setQuality(-1)}
                    className={`w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
                      currentLevel === -1 ? "bg-accent-indigo/20 text-accent-indigo" : "text-text-secondary hover:bg-bg-elevated"
                    }`}
                  >
                    Auto
                  </button>
                  {levels
                    .slice()
                    .sort((a, b) => b.height - a.height)
                    .map((l) => (
                      <button
                        key={l.index}
                        onClick={() => setQuality(l.index)}
                        className={`w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
                          currentLevel === l.index ? "bg-accent-indigo/20 text-accent-indigo" : "text-text-secondary hover:bg-bg-elevated"
                        }`}
                      >
                        {l.height}p
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          <button onClick={toggleFullscreen} className="text-white hover:text-accent-indigo transition-colors">
            {isFullscreen ? (
              <Minimize className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Maximize className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
