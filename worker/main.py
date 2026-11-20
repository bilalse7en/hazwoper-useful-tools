"""
FastAPI Standalone Worker for GTA 6 Gameplay Video-to-YouTube Shorts
100% Free & Open-Source (MIT)

Exposes REST API for:
- Health and hardware probing (GPU, CPU, NVENC/VAAPI, FFmpeg)
- Multimodal gameplay analysis & event discovery
- 9:16 Action-tracking & blurred-background video rendering
- Asynchronous durable job handling
"""

import os
import uuid
from typing import Any, Dict, List, Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from gta_analyzer import discover_gta_moments
from reframe_engine import render_short_clip

app = FastAPI(
    title="HAZWOPER AI GTA 6 Gameplay Shorts Worker",
    version="1.0.0",
    description="High-performance Python worker for GTA 6 gameplay event detection and vertical video reframing.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory durable job store
JOB_STORE: Dict[str, Dict[str, Any]] = {}


class AnalyzeRequest(BaseModel):
    video_path: str = Field(..., description="Local path or mounted path to video file")
    target_count: int = Field(default=4, ge=1, le=10)
    min_duration: float = Field(default=30.0, ge=15.0, le=90.0)
    max_duration: float = Field(default=60.0, ge=20.0, le=120.0)
    game_title: Optional[str] = "Grand Theft Auto VI"


class RenderRequest(BaseModel):
    input_video: str
    output_video: str
    start_time: float
    duration: float
    framing_mode: Optional[str] = "action-tracking"
    crop_x: Optional[int] = 50


@app.get("/health")
def health():
    import shutil
    has_ffmpeg = shutil.which("ffmpeg") is not None
    has_ffprobe = shutil.which("ffprobe") is not None

    has_gpu = False
    gpu_info = "CPU Only"
    try:
        import torch
        if torch.cuda.is_available():
            has_gpu = True
            gpu_info = torch.cuda.get_device_name(0)
    except Exception:
        pass

    return {
        "status": "healthy",
        "service": "gta-shorts-worker",
        "has_ffmpeg": has_ffmpeg,
        "has_ffprobe": has_ffprobe,
        "gpu_available": has_gpu,
        "device": gpu_info,
    }


@app.post("/api/v1/analyze-gameplay")
def analyze_gameplay(req: AnalyzeRequest):
    if not os.path.exists(req.video_path):
        raise HTTPException(status_code=404, detail=f"Video file not found at: {req.video_path}")

    moments = discover_gta_moments(
        video_path=req.video_path,
        target_count=req.target_count,
        min_duration=req.min_duration,
        max_duration=req.max_duration,
    )

    return {
        "success": True,
        "count": len(moments),
        "moments": [m.to_dict() for m in moments],
    }


@app.post("/api/v1/render-gameplay-short")
def render_gameplay_short(req: RenderRequest):
    if not os.path.exists(req.input_video):
        raise HTTPException(status_code=404, detail=f"Source video not found: {req.input_video}")

    success = render_short_clip(
        input_video=req.input_video,
        output_video=req.output_video,
        start_time=req.start_time,
        duration=req.duration,
        framing_mode=req.framing_mode or "action-tracking",
        crop_x_pct=req.crop_x or 50,
    )

    if not success:
        raise HTTPException(status_code=500, detail="FFmpeg video render failed.")

    return {
        "success": True,
        "output_path": req.output_video,
        "duration": req.duration,
    }


def process_background_job(job_id: str, video_path: str, target_count: int, min_dur: float, max_dur: float):
    JOB_STORE[job_id]["status"] = "processing"
    JOB_STORE[job_id]["progress"] = 25
    JOB_STORE[job_id]["stage"] = "analyzing_motion_and_audio"

    try:
        moments = discover_gta_moments(
            video_path=video_path,
            target_count=target_count,
            min_duration=min_dur,
            max_duration=max_dur,
        )
        JOB_STORE[job_id]["status"] = "completed"
        JOB_STORE[job_id]["progress"] = 100
        JOB_STORE[job_id]["stage"] = "done"
        JOB_STORE[job_id]["results"] = [m.to_dict() for m in moments]
    except Exception as e:
        JOB_STORE[job_id]["status"] = "failed"
        JOB_STORE[job_id]["error"] = str(e)


@app.post("/api/v1/jobs/submit")
def submit_job(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    JOB_STORE[job_id] = {
        "id": job_id,
        "status": "queued",
        "progress": 0,
        "stage": "queued",
        "video_path": req.video_path,
        "results": [],
    }

    background_tasks.add_task(
        process_background_job,
        job_id,
        req.video_path,
        req.target_count,
        req.min_duration,
        req.max_duration,
    )

    return {"job_id": job_id, "status": "queued"}


@app.get("/api/v1/jobs/{job_id}")
def get_job_status(job_id: str):
    if job_id not in JOB_STORE:
        raise HTTPException(status_code=404, detail="Job not found")
    return JOB_STORE[job_id]
