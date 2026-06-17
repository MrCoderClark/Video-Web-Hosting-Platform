"""Thumbnail generation service — extracts a frame from the video."""

import asyncio
import os

from config import settings


async def generate_thumbnail(
    input_path: str,
    output_dir: str,
    timestamp: str = "00:00:02",
) -> str:
    """
    Extract a single frame as a JPEG thumbnail.
    Returns the path to the generated thumbnail file.
    """
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "thumbnail.jpg")

    cmd = [
        settings.ffmpeg_path,
        "-i", input_path,
        "-ss", timestamp,
        "-vframes", "1",
        "-vf", "scale=640:-2",
        "-q:v", "3",
        output_path,
        "-y",
    ]

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()

    if proc.returncode != 0:
        # Try at 0 seconds if the timestamp is past video duration
        cmd[4] = "00:00:00"
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()
        if proc.returncode != 0:
            raise RuntimeError(f"Thumbnail generation failed: {stderr.decode()[-300:]}")

    return output_path
