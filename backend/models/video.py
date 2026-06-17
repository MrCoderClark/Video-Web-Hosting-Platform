from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class VideoStatus(str, Enum):
    uploading = "uploading"
    queued = "queued"
    processing = "processing"
    ready = "ready"
    error = "error"


class VideoVisibility(str, Enum):
    public = "public"
    unlisted = "unlisted"
    private = "private"


class VideoCreate(BaseModel):
    title: str = "Untitled"
    description: str | None = None


class VideoResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str | None
    status: VideoStatus
    visibility: VideoVisibility
    original_filename: str | None
    original_size_bytes: int | None
    storage_path: str | None
    thumbnail_url: str | None
    duration_seconds: float | None
    width: int | None
    height: int | None
    view_count: int
    created_at: datetime | None
    updated_at: datetime | None


class VideoListResponse(BaseModel):
    videos: list[VideoResponse]
    total: int


class UploadResponse(BaseModel):
    id: str
    status: VideoStatus
    message: str
