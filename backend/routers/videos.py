import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from auth import get_current_user
from database import get_pool
from models.video import UploadResponse, VideoListResponse, VideoResponse, VideoStatus
from services.storage import (
    build_storage_path,
    upload_to_storage,
    validate_file,
)

router = APIRouter(prefix="/videos", tags=["videos"])


@router.post("/upload", response_model=UploadResponse)
async def upload_video(
    file: UploadFile,
    title: str = "Untitled",
    description: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    """Upload a video file to storage and create a DB record."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Get file size by reading content
    file_bytes = await file.read()
    file_size = len(file_bytes)

    # Validate
    error = validate_file(file.filename, file_size)
    if error:
        raise HTTPException(status_code=400, detail=error)

    video_id = str(uuid.uuid4())
    user_id = current_user["id"]
    storage_path = build_storage_path(user_id, video_id, file.filename)

    # Upload to Supabase Storage
    try:
        await upload_to_storage(
            file_bytes=file_bytes,
            storage_path=storage_path,
            content_type=file.content_type or "video/mp4",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Storage upload failed: {str(e)}",
        )

    # Create DB record
    pool = await get_pool()
    await pool.execute(
        """
        INSERT INTO videohost.videos (id, user_id, title, description, status, original_filename, original_size_bytes, storage_path)
        VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8)
        """,
        uuid.UUID(video_id),
        uuid.UUID(user_id),
        title or file.filename.rsplit(".", 1)[0],
        description,
        "queued",
        file.filename,
        file_size,
        storage_path,
    )

    return UploadResponse(
        id=video_id,
        status=VideoStatus.queued,
        message="Upload complete. Video queued for processing.",
    )


@router.get("", response_model=VideoListResponse)
async def list_videos(current_user: dict = Depends(get_current_user)):
    """List all videos for the current user."""
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT id, user_id, title, description, status, original_filename,
               original_size_bytes, storage_path, thumbnail_url, duration_seconds,
               width, height, created_at, updated_at
        FROM videohost.videos
        WHERE user_id = $1
        ORDER BY created_at DESC
        """,
        uuid.UUID(current_user["id"]),
    )

    videos = [
        VideoResponse(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            title=row["title"],
            description=row["description"],
            status=row["status"],
            original_filename=row["original_filename"],
            original_size_bytes=row["original_size_bytes"],
            storage_path=row["storage_path"],
            thumbnail_url=row["thumbnail_url"],
            duration_seconds=float(row["duration_seconds"]) if row["duration_seconds"] else None,
            width=row["width"],
            height=row["height"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
        for row in rows
    ]

    return VideoListResponse(videos=videos, total=len(videos))


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(video_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single video by ID (must belong to current user)."""
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        SELECT id, user_id, title, description, status, original_filename,
               original_size_bytes, storage_path, thumbnail_url, duration_seconds,
               width, height, created_at, updated_at
        FROM videohost.videos
        WHERE id = $1 AND user_id = $2
        """,
        uuid.UUID(video_id),
        uuid.UUID(current_user["id"]),
    )

    if not row:
        raise HTTPException(status_code=404, detail="Video not found")

    return VideoResponse(
        id=str(row["id"]),
        user_id=str(row["user_id"]),
        title=row["title"],
        description=row["description"],
        status=row["status"],
        original_filename=row["original_filename"],
        original_size_bytes=row["original_size_bytes"],
        storage_path=row["storage_path"],
        thumbnail_url=row["thumbnail_url"],
        duration_seconds=float(row["duration_seconds"]) if row["duration_seconds"] else None,
        width=row["width"],
        height=row["height"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )
