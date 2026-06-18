import type { Metadata } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8007";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${BACKEND_URL}/api/public/videos/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("Not found");
    const video = await res.json();

    const title = `${video.title} | VideoHost`;
    const description = video.description || `Watch ${video.title} on VideoHost`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "video.other",
        ...(video.thumbnail_url && {
          images: [{ url: video.thumbnail_url, width: 1280, height: 720 }],
        }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(video.thumbnail_url && { images: [video.thumbnail_url] }),
      },
    };
  } catch {
    return { title: "Video | VideoHost" };
  }
}

export default function WatchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
