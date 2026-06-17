"""FFmpeg transcoding service — produces HLS output at multiple resolutions."""

import asyncio
import os
import shutil
import tempfile
from pathlib import Path

from config import settings

# Resolution presets: (name, width, height, video_bitrate, audio_bitrate)
PRESETS = [
    ("360p", 640, 360, "800k", "96k"),
    ("720p", 1280, 720, "2500k", "128k"),
    ("1080p", 1920, 1080, "5000k", "192k"),
]

HLS_SEGMENT_DURATION = 6  # seconds per .ts segment


async def probe_video(input_path: str) -> dict:
    """Get video metadata using ffprobe."""
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        input_path,
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, _ = await proc.communicate()

    import json
    data = json.loads(stdout.decode())

    # Extract video stream info
    video_stream = next(
        (s for s in data.get("streams", []) if s.get("codec_type") == "video"),
        {},
    )
    duration = float(data.get("format", {}).get("duration", 0))
    width = int(video_stream.get("width", 0))
    height = int(video_stream.get("height", 0))

    return {"duration": duration, "width": width, "height": height}


def get_applicable_presets(source_height: int) -> list[tuple]:
    """Only transcode to resolutions <= source resolution."""
    return [p for p in PRESETS if p[2] <= source_height]


async def transcode_to_hls(
    input_path: str,
    output_dir: str,
    preset: tuple,
) -> str:
    """Transcode input video to a single HLS resolution. Returns the playlist path."""
    name, width, height, vbitrate, abitrate = preset
    preset_dir = os.path.join(output_dir, name)
    os.makedirs(preset_dir, exist_ok=True)

    playlist_path = os.path.join(preset_dir, "playlist.m3u8")
    segment_pattern = os.path.join(preset_dir, "segment_%03d.ts")

    cmd = [
        settings.ffmpeg_path,
        "-i", input_path,
        "-vf", f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2",
        "-c:v", "libx264",
        "-preset", "fast",
        "-b:v", vbitrate,
        "-c:a", "aac",
        "-b:a", abitrate,
        "-hls_time", str(HLS_SEGMENT_DURATION),
        "-hls_list_size", "0",
        "-hls_segment_filename", segment_pattern,
        "-f", "hls",
        playlist_path,
        "-y",
    ]

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()

    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg transcode failed for {name}: {stderr.decode()[-500:]}")

    return playlist_path


def generate_master_playlist(output_dir: str, presets: list[tuple]) -> str:
    """Generate a master HLS playlist that references each resolution variant."""
    master_path = os.path.join(output_dir, "master.m3u8")
    lines = ["#EXTM3U"]

    for name, width, height, vbitrate, _ in presets:
        # Parse bitrate to integer
        bw = int(vbitrate.replace("k", "")) * 1000
        lines.append(
            f"#EXT-X-STREAM-INF:BANDWIDTH={bw},RESOLUTION={width}x{height}"
        )
        lines.append(f"{name}/playlist.m3u8")

    with open(master_path, "w") as f:
        f.write("\n".join(lines) + "\n")

    return master_path


async def run_transcode(input_path: str, output_dir: str) -> dict:
    """
    Full transcode pipeline:
    1. Probe source video
    2. Transcode to applicable HLS presets
    3. Generate master playlist

    Returns metadata dict with duration, width, height, and output_dir.
    """
    # Probe
    metadata = await probe_video(input_path)
    source_height = metadata["height"]

    # Determine presets (at least 360p)
    presets = get_applicable_presets(source_height)
    if not presets:
        presets = [PRESETS[0]]  # fallback to 360p

    # Transcode each resolution
    for preset in presets:
        await transcode_to_hls(input_path, output_dir, preset)

    # Master playlist
    generate_master_playlist(output_dir, presets)

    metadata["presets"] = [p[0] for p in presets]
    metadata["output_dir"] = output_dir
    return metadata
