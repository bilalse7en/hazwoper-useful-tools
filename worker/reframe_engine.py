"""
Reframe & FFmpeg Render Engine for GTA 6 Shorts (Python Worker)
100% Free & Open-Source (MIT)

Generates:
- 9:16 Portrait (1080x1920) action tracking crop (following vehicle/action centroid)
- Blurred background layout preserving full 16:9 gameplay FOV and HUD
- Fade transitions & audio normalization (-14 LUFS)
"""

from __future__ import annotations

import os
import subprocess
from typing import Dict, List, Optional


def build_ffmpeg_render_command(
    input_video: str,
    output_video: str,
    start_time: float,
    duration: float,
    framing_mode: str = "action-tracking",
    crop_x_pct: int = 50,
    aspect_ratio: str = "9:16",
    normalize_audio: bool = True,
) -> List[str]:
    """
    Constructs safe, high-speed FFmpeg CLI arguments.
    """
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(round(start_time, 3)),
        "-t", str(round(duration, 3)),
        "-i", input_video,
    ]

    target_w = 1080 if aspect_ratio == "9:16" else 1920
    target_h = 1920 if aspect_ratio == "9:16" else 1080

    if aspect_ratio == "9:16":
        if framing_mode in ("blurred-bg", "gameplay-blur-bg"):
            # Ambient blurred background with centered 16:9 gameplay
            vf = (
                f"scale={target_w}:{target_h}:force_original_aspect_ratio=increase:flags=lanczos,boxblur=20:5,setsar=1[bg];"
                f"[0:v]scale={target_w}:-1:force_original_aspect_ratio=decrease:flags=lanczos[fg];"
                f"[bg][fg]overlay=(W-w)/2:(H-h)/2,fade=t=in:st=0:d=0.4"
            )
            cmd.extend(["-filter_complex", vf])
        else:
            # Action tracking crop centered at crop_x_pct
            bounded_pct = max(0, min(100, crop_x_pct))
            crop_filter = (
                f"crop='min(iw,ih*9/16):min(ih,iw*16/9):(iw-out_w)*{bounded_pct}/100:(ih-out_h)/2',"
                f"scale={target_w}:{target_h}:flags=lanczos,setsar=1,fade=t=in:st=0:d=0.4"
            )
            cmd.extend(["-vf", crop_filter])
    else:
        cmd.extend(["-vf", f"scale={target_w}:{target_h}:force_original_aspect_ratio=decrease,pad={target_w}:{target_h}:(ow-iw)/2:(oh-ih)/2"])

    # Audio filters
    af_filters = ["afade=t=in:st=0:d=0.4"]
    if normalize_audio:
        af_filters.append("loudnorm=I=-14:TP=-1.0:LRA=11")
    cmd.extend(["-af", ",".join(af_filters)])

    # Fast encoding parameters
    cmd.extend([
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "48000",
        "-movflags", "+faststart",
        output_video
    ])

    return cmd


def render_short_clip(
    input_video: str,
    output_video: str,
    start_time: float,
    duration: float,
    framing_mode: str = "action-tracking",
    crop_x_pct: int = 50,
) -> bool:
    """
    Executes FFmpeg clip rendering.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_video)), exist_ok=True)
    cmd = build_ffmpeg_render_command(
        input_video=input_video,
        output_video=output_video,
        start_time=start_time,
        duration=duration,
        framing_mode=framing_mode,
        crop_x_pct=crop_x_pct,
    )
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return res.returncode == 0 and os.path.exists(output_video)
