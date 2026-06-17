import uuid

from supabase import create_client

from config import settings

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v"}
MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024  # 2 GB
BUCKET_NAME = "videos"


def get_supabase_client():
    """Create a Supabase client with the service role key for storage operations."""
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def validate_file(filename: str, size: int) -> str | None:
    """Validate file extension and size. Returns error message or None."""
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return f"Invalid file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
    if size > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE // (1024 * 1024)
        return f"File too large. Maximum size is {max_mb} MB."
    return None


def build_storage_path(user_id: str, video_id: str, filename: str) -> str:
    """Build the storage path: {user_id}/{video_id}/{filename}"""
    return f"{user_id}/{video_id}/{filename}"


async def upload_to_storage(file_bytes: bytes, storage_path: str, content_type: str) -> str:
    """Upload file bytes to Supabase Storage. Returns the storage path."""
    client = get_supabase_client()
    client.storage.from_(BUCKET_NAME).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": content_type},
    )
    return storage_path
