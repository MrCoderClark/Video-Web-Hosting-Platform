"""Public endpoints — no auth required. Browse videos, watch, stream HLS."""

import uuid

from fastapi import APIRouter, HTTPException, Query, Response
from supabase import create_client

from config import settings
from database import get_pool

router = APIRouter(prefix="/public", tags=["public"])

BUCKET_NAME = "videos"


def _supabase():
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


# ── Browse / search ────────────────────────────────────────────────

@router.get("/videos")
async def browse_videos(
    q: str | None = Query(None, description="Search query (title/description)"),
    limit: int = Query(24, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List all ready videos, optionally filtered by search query."""
    pool = await get_pool()

    if q:
        rows = await pool.fetch(
            """
            SELECT v.id, v.title, v.description, v.thumbnail_url,
                   v.duration_seconds, v.width, v.height, v.created_at,
                   p.display_name AS uploader_name
            FROM videohost.videos v
            LEFT JOIN videohost.profiles p ON p.id = v.user_id
            WHERE v.status = 'ready' AND v.visibility = 'public'
              AND (v.title ILIKE '%' || $1 || '%' OR v.description ILIKE '%' || $1 || '%')
            ORDER BY v.created_at DESC
            LIMIT $2 OFFSET $3
            """,
            q, limit, offset,
        )
    else:
        rows = await pool.fetch(
            """
            SELECT v.id, v.title, v.description, v.thumbnail_url,
                   v.duration_seconds, v.width, v.height, v.created_at,
                   p.display_name AS uploader_name
            FROM videohost.videos v
            LEFT JOIN videohost.profiles p ON p.id = v.user_id
            WHERE v.status = 'ready' AND v.visibility = 'public'
            ORDER BY v.created_at DESC
            LIMIT $1 OFFSET $2
            """,
            limit, offset,
        )

    return {
        "videos": [
            {
                "id": str(r["id"]),
                "title": r["title"],
                "description": r["description"],
                "thumbnail_url": r["thumbnail_url"],
                "duration_seconds": float(r["duration_seconds"]) if r["duration_seconds"] else None,
                "width": r["width"],
                "height": r["height"],
                "uploader_name": r["uploader_name"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            }
            for r in rows
        ],
        "count": len(rows),
    }


# ── Single video detail ────────────────────────────────────────────

@router.get("/videos/{video_id}")
async def get_public_video(video_id: str):
    """Get public metadata for a single ready video (public or unlisted)."""
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        SELECT v.id, v.title, v.description, v.thumbnail_url,
               v.duration_seconds, v.width, v.height, v.view_count, v.created_at,
               p.display_name AS uploader_name
        FROM videohost.videos v
        LEFT JOIN videohost.profiles p ON p.id = v.user_id
        WHERE v.id = $1 AND v.status = 'ready' AND v.visibility IN ('public', 'unlisted')
        """,
        uuid.UUID(video_id),
    )

    if not row:
        raise HTTPException(status_code=404, detail="Video not found")

    # Increment view count (fire-and-forget)
    await pool.execute(
        "UPDATE videohost.videos SET view_count = view_count + 1 WHERE id = $1",
        uuid.UUID(video_id),
    )

    return {
        "id": str(row["id"]),
        "title": row["title"],
        "description": row["description"],
        "thumbnail_url": row["thumbnail_url"],
        "duration_seconds": float(row["duration_seconds"]) if row["duration_seconds"] else None,
        "width": row["width"],
        "height": row["height"],
        "view_count": row["view_count"],
        "uploader_name": row["uploader_name"],
        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
    }


# ── HLS proxy ──────────────────────────────────────────────────────

@router.get("/videos/{video_id}/hls/{file_path:path}")
async def proxy_hls(video_id: str, file_path: str):
    """
    Proxy HLS files (.m3u8 and .ts) from the private Supabase Storage bucket.
    URL pattern: /api/public/videos/<id>/hls/master.m3u8
                 /api/public/videos/<id>/hls/720p/playlist.m3u8
                 /api/public/videos/<id>/hls/720p/segment_000.ts
    """
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        SELECT user_id FROM videohost.videos
        WHERE id = $1 AND status = 'ready' AND visibility IN ('public', 'unlisted')
        """,
        uuid.UUID(video_id),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Video not found")

    user_id = str(row["user_id"])
    storage_path = f"{user_id}/{video_id}/hls/{file_path}"

    try:
        client = _supabase()
        data = client.storage.from_(BUCKET_NAME).download(storage_path)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found in storage")

    if file_path.endswith(".m3u8"):
        content_type = "application/vnd.apple.mpegurl"
    elif file_path.endswith(".ts"):
        content_type = "video/mp2t"
    else:
        content_type = "application/octet-stream"

    return Response(
        content=data,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
        },
    )
