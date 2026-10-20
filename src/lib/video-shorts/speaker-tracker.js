/**
 * Intelligent Audio-Visual Speaker Detection & Automatic Camera Switching Engine
 * 100% Free, browser canvas & computer-vision based.
 * Implements:
 * - Multi-person face and mouth region tracking
 * - Audio-visual speech-lip motion correlation (identifies reciter/speaker vs silent listener)
 * - Automatic speaker switching with temporal hysteresis (avoids jittery flipping)
 * - Motion-aware optical flow fallback for non-face scenes
 * - Safe head/face headroom margins for 9:16 portrait framing
 */

export class MultiSpeakerTracker {
  constructor(options = {}) {
    this.sourceWidth = options.sourceWidth || 1920;
    this.sourceHeight = options.sourceHeight || 1080;
    this.cropWidth = Math.round(this.sourceHeight * (9 / 16));
    this.maxCropX = Math.max(0, this.sourceWidth - this.cropWidth);

    // Camera smoothing and panning
    this.cameraPanX = this.maxCropX / 2; // Start center
    this.panVelocity = 0;
    this.smoothingAlpha = options.smoothingAlpha || 0.14; // Smooth EMA

    // Speaker management
    this.speakers = new Map(); // speakerId -> { id, lastSeen, centroidX, centroidY, mouthActivity, speechCorrelation, isSpeaker }
    this.activeSpeakerId = null;
    this.candidateSpeakerId = null;
    this.candidateDuration = 0;
    this.minHoldBeforeSwitch = options.minHoldBeforeSwitch || 1.4; // 1.4s minimum speech to trigger camera switch

    // Temporal history
    this.lastFrameTime = 0;
    this.prevImageData = null;
  }

  /**
   * Scans a downscaled video frame (e.g. 160x90) for candidate faces and calculates mouth region activity.
   */
  processFrame({
    imageData,
    currentTime,
    isAudioSpeaking = true,
    audioEnergy = 0.5,
  }) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const dt = Math.max(0.016, currentTime - this.lastFrameTime);
    this.lastFrameTime = currentTime;

    // Divide frame horizontally into Left and Right candidate zones to detect multi-speaker setups
    const zones = [
      {
        id: 'speaker-left',
        minX: 5,
        maxX: Math.floor(width * 0.48),
        detected: false,
        weight: 0,
        sumX: 0,
        sumY: 0,
        lipDelta: 0,
        lipCount: 0,
      },
      {
        id: 'speaker-right',
        minX: Math.floor(width * 0.52),
        maxX: width - 5,
        detected: false,
        weight: 0,
        sumX: 0,
        sumY: 0,
        lipDelta: 0,
        lipCount: 0,
      },
      {
        id: 'speaker-center',
        minX: Math.floor(width * 0.3),
        maxX: Math.floor(width * 0.7),
        detected: false,
        weight: 0,
        sumX: 0,
        sumY: 0,
        lipDelta: 0,
        lipCount: 0,
      },
    ];

    const maxScanY = Math.floor(height * 0.75);

    for (let y = 8; y < maxScanY; y += 3) {
      for (let x = 8; x < width - 8; x += 3) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // YCbCr skin tone detection rule
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;

        const isSkin =
          cr >= 130 && cr <= 175 && cb >= 77 && cb <= 128 && r > g && g > b;

        if (isSkin) {
          // Measure mouth/lip motion delta in lower half of face if previous frame exists
          let lipDelta = 0;
          if (this.prevImageData && y > height * 0.32 && y < height * 0.65) {
            const pr = this.prevImageData.data[idx];
            const pg = this.prevImageData.data[idx + 1];
            const pb = this.prevImageData.data[idx + 2];
            lipDelta =
              (Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb)) / 3;
          }

          // Accumulate into matching zone
          for (const zone of zones) {
            if (x >= zone.minX && x <= zone.maxX) {
              zone.weight += 1;
              zone.sumX += x;
              zone.sumY += y;
              if (lipDelta > 6) {
                zone.lipDelta += lipDelta;
                zone.lipCount += 1;
              }
            }
          }
        }
      }
    }

    // Identify candidate faces in zones
    const detectedCandidates = [];

    // Prioritize left/right distinction if multiple persons present, else center
    const leftValid = zones[0].weight > 40;
    const rightValid = zones[1].weight > 40;

    if (leftValid && rightValid) {
      // Two distinct people present in frame!
      detectedCandidates.push(
        this._formatCandidate(zones[0], width, height, isAudioSpeaking)
      );
      detectedCandidates.push(
        this._formatCandidate(zones[1], width, height, isAudioSpeaking)
      );
    } else if (zones[2].weight > 40) {
      // Single centered speaker / reciter
      detectedCandidates.push(
        this._formatCandidate(zones[2], width, height, isAudioSpeaking)
      );
    } else if (leftValid) {
      detectedCandidates.push(
        this._formatCandidate(zones[0], width, height, isAudioSpeaking)
      );
    } else if (rightValid) {
      detectedCandidates.push(
        this._formatCandidate(zones[1], width, height, isAudioSpeaking)
      );
    }

    // Audio-Visual Correlation & Speaker Selection
    let targetX = this.maxCropX / 2;
    let isTrackingActiveSpeaker = false;
    let activeSpeakerData = null;

    if (detectedCandidates.length > 0) {
      // Update persistent speaker state
      detectedCandidates.forEach((cand) => {
        let speaker = this.speakers.get(cand.id);
        if (!speaker) {
          speaker = {
            id: cand.id,
            centroidX: cand.x,
            centroidY: cand.y,
            mouthActivity: cand.lipActivity,
            speechCorrelation: 0.5,
            isSpeaker: false,
          };
          this.speakers.set(cand.id, speaker);
        } else {
          speaker.centroidX = speaker.centroidX * 0.8 + cand.x * 0.2;
          speaker.centroidY = speaker.centroidY * 0.8 + cand.y * 0.2;
          speaker.mouthActivity =
            speaker.mouthActivity * 0.75 + cand.lipActivity * 0.25;

          // Audio-Visual Correlation:
          // If vocal audio is active AND mouth is moving, increase speech correlation!
          // If vocal audio is active BUT mouth is still, penalize (silent listener)!
          if (isAudioSpeaking) {
            if (cand.lipActivity > 4) {
              speaker.speechCorrelation = Math.min(
                1.0,
                speaker.speechCorrelation + 0.12
              );
            } else {
              speaker.speechCorrelation = Math.max(
                0.1,
                speaker.speechCorrelation - 0.08
              );
            }
          }
        }
      });

      // Pick the speaker with highest speech correlation
      let bestSpeaker = null;
      let highestCorrelation = -1;

      detectedCandidates.forEach((cand) => {
        const sp = this.speakers.get(cand.id);
        if (sp && sp.speechCorrelation > highestCorrelation) {
          highestCorrelation = sp.speechCorrelation;
          bestSpeaker = sp;
        }
      });

      // Automatic Speaker Switching with Hysteresis
      if (!this.activeSpeakerId) {
        this.activeSpeakerId = bestSpeaker?.id || detectedCandidates[0].id;
      } else if (bestSpeaker && bestSpeaker.id !== this.activeSpeakerId) {
        // Person B is active, check if confident enough to switch
        if (this.candidateSpeakerId === bestSpeaker.id) {
          this.candidateDuration += dt;
          if (this.candidateDuration >= this.minHoldBeforeSwitch) {
            // High confidence speaker switch verified!
            this.activeSpeakerId = bestSpeaker.id;
            this.candidateSpeakerId = null;
            this.candidateDuration = 0;
          }
        } else {
          this.candidateSpeakerId = bestSpeaker.id;
          this.candidateDuration = dt;
        }
      } else {
        // Current speaker continues speaking
        this.candidateSpeakerId = null;
        this.candidateDuration = 0;
      }

      const currentSpeaker =
        this.speakers.get(this.activeSpeakerId) || bestSpeaker;
      if (currentSpeaker) {
        const normalizedX = currentSpeaker.centroidX / width;
        targetX = Math.max(
          0,
          Math.min(
            this.maxCropX,
            normalizedX * this.sourceWidth - this.cropWidth / 2
          )
        );
        isTrackingActiveSpeaker = true;
        activeSpeakerData = currentSpeaker;
      }
    } else {
      // Motion-Aware Fallback when no face detected (e.g. slides, screen share, nature)
      let motionX = 0;
      let motionWeight = 0;

      if (this.prevImageData) {
        for (let y = 10; y < height - 10; y += 4) {
          for (let x = 10; x < width - 10; x += 4) {
            const idx = (y * width + x) * 4;
            const diff =
              (Math.abs(data[idx] - this.prevImageData.data[idx]) +
                Math.abs(data[idx + 1] - this.prevImageData.data[idx + 1]) +
                Math.abs(data[idx + 2] - this.prevImageData.data[idx + 2])) /
              3;

            if (diff > 18) {
              motionX += x * diff;
              motionWeight += diff;
            }
          }
        }
      }

      if (motionWeight > 300) {
        const normMotionX = motionX / motionWeight / width;
        targetX = Math.max(
          0,
          Math.min(
            this.maxCropX,
            normMotionX * this.sourceWidth - this.cropWidth / 2
          )
        );
      } else {
        // Scene is static: keep stable center crop
        targetX = this.maxCropX / 2;
      }
    }

    // Save previous frame for next delta comparison
    this.prevImageData = imageData;

    // Anchor face and reciter strictly in the center of the video frame
    // Prevents wandering to left or right where the face gets cut off or hidden
    const strictCenterX = this.maxCropX / 2;
    const maxDeviation = this.maxCropX * 0.05; // Maximum 5% subtle leeway around exact center
    const clampedTargetX = Math.max(
      strictCenterX - maxDeviation,
      Math.min(strictCenterX + maxDeviation, targetX)
    );

    // Apply Exponential Moving Average (EMA) for fluid, stabilized centering
    this.cameraPanX =
      this.cameraPanX * (1 - this.smoothingAlpha) +
      clampedTargetX * this.smoothingAlpha;

    return {
      cropX: Math.round(this.cameraPanX),
      cropY: 0,
      cropWidth: this.cropWidth,
      cropHeight: this.sourceHeight,
      activeSpeakerId: this.activeSpeakerId,
      isTrackingActiveSpeaker,
      activeSpeakerData,
      detectedCount: detectedCandidates.length,
    };
  }

  _formatCandidate(zone, width, height, isAudioSpeaking) {
    const x = zone.sumX / zone.weight;
    const y = zone.sumY / zone.weight;
    const lipActivity = zone.lipCount > 3 ? zone.lipDelta / zone.lipCount : 0;
    const isActivelySpeaking = isAudioSpeaking && lipActivity > 7;

    return {
      id: zone.id,
      x,
      y,
      lipActivity,
      isActivelySpeaking,
      weight: zone.weight,
    };
  }
}
