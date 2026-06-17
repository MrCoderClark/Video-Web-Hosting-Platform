"""
Background transcoding worker.
Polls the database for videos with status 'queued', downloads the original,
runs FFmpeg transcode + thumbnail generation, uploads HLS output to storage,
and updates the DB status to 'ready' or 'error'.
"""

import asyncio
import logging
import os
import shutil
import tempfile
import uuid

import asyncpg
from supabase import create_client

from config import settings
from services.thumbnail import generate_thumbnail
from services.transcode import run_transcode

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

POLL_INTERVAL = 5  # seconds between polling for queued videos
BUCKET_NAME = "videos"


def get_supabase_client():
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


async def get_pool() -> asyncpg.Pool:
    return await asyncpg.create_pool(
        host=settings.pg_host,
        port=settings.pg_port,
        database=settings.pg_db,
        user=settings.pg_user,
        password=settings.pg_password,
        min_size=1,
        max_size=3,
        statement_cache_size=0,
    )


async def update_video_status(pool: asyncpg.Pool, video_id: str, status: str, **kwargs):
    """Update video status and optional metadata fields."""
    sets = ["status = $2::videohost.video_status"]
    values: list = [uuid.UUID(video_id), status]
    idx = 3

    for key, value in kwargs.items():
        sets.append(f"{key} = ${idx}")
        values.append(value)
        idx += 1

    query = f"UPDATE videohost.videos SET {', '.join(sets)} WHERE id = $1"
    await pool.execute(query, *values)


async def download_from_storage(storage_path: str, local_path: str):
    """Download a file from Supabase Storage to a local path."""
    client = get_supabase_client()
    data = client.storage.from_(BUCKET_NAME).download(storage_path)
    with open(local_path, "wb") as f:
        f.write(data)


async def upload_directory_to_storage(
    local_dir: str,
    storage_base_path: str,
):
    """Upload all files in a local directory tree to Supabase Storage."""
    client = get_supabase_client()
    bucket = client.storage.from_(BUCKET_NAME)

    for root, _dirs, files in os.walk(local_dir):
        for filename in files:
            local_file = os.path.join(root, filename)
            relative = os.path.relpath(local_file, local_dir).replace("\\", "/")
            remote_path = f"{storage_base_path}/hls/{relative}"

            with open(local_file, "rb") as f:
                file_bytes = f.read()

            content_type = "application/vnd.apple.mpegurl" if filename.endswith(".m3u8") else "video/mp2t"
            if filename.endswith(".jpg") or filename.endswith(".jpeg"):
                content_type = "image/jpeg"

            bucket.upload(
                path=remote_path,
                file=file_bytes,
                file_options={"content-type": content_type},
            )


async def upload_thumbnail_to_storage(
    local_path: str,
    storage_base_path: str,
) -> str:
    """Upload thumbnail to storage and return a signed URL."""
    client = get_supabase_client()
    bucket = client.storage.from_(BUCKET_NAME)
    remote_path = f"{storage_base_path}/thumbnail.jpg"

    with open(local_path, "rb") as f:
        file_bytes = f.read()

    bucket.upload(
        path=remote_path,
        file=file_bytes,
        file_options={"content-type": "image/jpeg"},
    )

    # Generate a long-lived signed URL (1 year)
    signed = bucket.create_signed_url(remote_path, 365 * 24 * 3600)
    return signed.get("signedURL", remote_path)


async def process_video(pool: asyncpg.Pool, video: dict):
    """Process a single video: transcode + thumbnail + upload."""
    video_id = str(video["id"])
    user_id = str(video["user_id"])
    storage_path = video["storage_path"]
    storage_base = f"{user_id}/{video_id}"

    logger.info(f"Processing video {video_id} ({video['original_filename']})")

    # Mark as processing
    await update_video_status(pool, video_id, "processing")

    tmp_dir = tempfile.mkdtemp(prefix=f"transcode_{video_id}_")
    try:
        # Download original
        input_path = os.path.join(tmp_dir, "original" + os.path.splitext(video["original_filename"])[1])
        await download_from_storage(storage_path, input_path)
        logger.info(f"  Downloaded original to {input_path}")

        # Transcode to HLS
        hls_output_dir = os.path.join(tmp_dir, "hls")
        os.makedirs(hls_output_dir, exist_ok=True)
        metadata = await run_transcode(input_path, hls_output_dir)
        logger.info(f"  Transcoded: {metadata['presets']} ({metadata['duration']:.1f}s)")

        # Generate thumbnail
        thumb_path = await generate_thumbnail(input_path, tmp_dir)
        logger.info(f"  Thumbnail generated")

        # Upload HLS output to storage
        await upload_directory_to_storage(hls_output_dir, storage_base)
        logger.info(f"  HLS uploaded to storage")

        # Upload thumbnail
        thumb_remote = await upload_thumbnail_to_storage(thumb_path, storage_base)
        logger.info(f"  Thumbnail uploaded")

        # Update DB: ready
        await update_video_status(
            pool,
            video_id,
            "ready",
            duration_seconds=metadata["duration"],
            width=metadata["width"],
            height=metadata["height"],
            thumbnail_url=thumb_remote,
        )
        logger.info(f"  Video {video_id} → ready")

    except Exception as e:
        logger.error(f"  Error processing {video_id}: {e}")
        await update_video_status(pool, video_id, "error")

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


async def worker_loop():
    """Main worker loop — poll for queued videos and process them."""
    logger.info("Transcode worker starting...")
    pool = await get_pool()
    logger.info("Connected to database")

    while True:
        try:
            # Fetch one queued video at a time (FIFO)
            row = await pool.fetchrow(
                """
                UPDATE videohost.videos
                SET status = $1::videohost.video_status
                WHERE id = (
                    SELECT id FROM videohost.videos
                    WHERE status = $2::videohost.video_status
                    ORDER BY created_at ASC
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED
                )
                RETURNING id, user_id, storage_path, original_filename
                """,
                "processing",
                "queued",
            )

            if row:
                await process_video(pool, row)
            else:
                await asyncio.sleep(POLL_INTERVAL)

        except Exception as e:
            logger.error(f"Worker error: {e}")
            await asyncio.sleep(POLL_INTERVAL)


def main():
    """Entry point for the transcode worker."""
    asyncio.run(worker_loop())


if __name__ == "__main__":
    main()
