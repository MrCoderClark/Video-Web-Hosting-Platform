"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VideoPlayer } from "@/components/video-player";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8007";

export default function EmbedPage() {
  const params = useParams<{ id: string }>();
  const [hlsSrc, setHlsSrc] = useState("");
  const [poster, setPoster] = useState<string | undefined>();

  useEffect(() => {
    if (!params.id) return;

    fetch(`${BACKEND_URL}/api/public/videos/${params.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setHlsSrc(`${BACKEND_URL}/api/public/videos/${data.id}/hls/master.m3u8`);
          setPoster(data.thumbnail_url || undefined);
        }
      })
      .catch(() => {});
  }, [params.id]);

  if (!hlsSrc) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black">
      <VideoPlayer src={hlsSrc} poster={poster} videoId={params.id} />
    </div>
  );
}
