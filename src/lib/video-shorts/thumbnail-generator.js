/**
 * AI Thumbnail Generator for Video Shorts
 * Extracts the peak hook frame from each short and renders a 9:16 viral cover
 * with dynamic gradient typography, category badges, and high-retention text lines.
 * Supports authentic Urdu "Kumail Font" for Top Naat Name and Bottom Center Reciter Name.
 * 100% Free, client-side Canvas rendering.
 */

/**
 * Generates a high-definition 9:16 thumbnail with AI-styled viral text and badges.
 *
 * @param {object} params
 * @param {HTMLVideoElement} [params.videoElement] - Source video element
 * @param {string} [params.imageUrl] - Direct image/thumbnail URL (e.g. YouTube maxres thumbnail)
 * @param {number} [params.timestamp] - Capture time in seconds
 * @param {string} [params.title] - Main hook headline / Naat name
 * @param {string} [params.subline] - Spoken line or reciter name
 * @param {string} [params.topText] - Explicit top headline (Naat name) in Kumail font
 * @param {string} [params.bottomText] - Explicit bottom center headline (Reciter name) in Kumail font
 * @param {number} [params.clipIndex] - Short index (e.g. 1, 2, 3)
 * @returns {Promise<string>} Base64 Data URL of the generated thumbnail image
 */
export async function generateShortThumbnail({
  videoElement,
  imageUrl,
  timestamp = 0,
  title = 'VIRAL HOOK',
  subline = '',
  topText = '',
  bottomText = '',
  clipIndex = 1,
}) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    // High-definition 9:16 Portrait Canvas (1080 x 1920)
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    const drawOverlaysAndResolve = () => {
      try {
        const kumailFont =
          "'Kumail', 'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'Jameel Noori Nastaleeq', Arial, sans-serif";

        // 3. Draw Top Category / Hook Badge
        ctx.save();
        const badgeY = 140;
        const isNaatOrUrdu =
          /naat|kalam|durood|urdu|subhan|madina|nabi|pakistan|bangladesh|india/i.test(
            title + ' ' + subline + ' ' + topText + ' ' + bottomText
          );
        const badgeText = isNaatOrUrdu
          ? `🕌 NAAT SHARIF • SHORT #${clipIndex} • SUBHAN ALLAH`
          : `★ SHORT #${clipIndex} • HIGH VIRAL RETENTION`;
        ctx.font = '900 30px Impact, Arial Black, sans-serif';
        const badgeW = ctx.measureText(badgeText).width + 50;
        const badgeH = 58;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; // Clean translucent
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.95)'; // Golden border
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (ctx.roundRect)
          ctx.roundRect(
            (canvas.width - badgeW) / 2,
            badgeY,
            badgeW,
            badgeH,
            29
          );
        else ctx.rect((canvas.width - badgeW) / 2, badgeY, badgeW, badgeH);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FDE047'; // Soft Gold
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, canvas.width / 2, badgeY + badgeH / 2);
        ctx.restore();

        // 4. Draw Top Headline / Naat Name across Upper Third in Kumail Urdu Font
        const activeTop = (topText || title).trim();
        if (activeTop) {
          ctx.save();
          const headlineY = 240;
          const isUrduScript =
            /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
              activeTop
            );

          ctx.font = isUrduScript
            ? `900 68px ${kumailFont}`
            : '900 64px Impact, Arial Black, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          // Prepare headline words (split in 2 lines if long)
          const cleanTitle = activeTop.replace(/\([^)]*\)/g, '').trim();
          const words = cleanTitle.split(' ');
          let line1 = cleanTitle;
          let line2 = '';

          if (words.length > 4) {
            const mid = Math.ceil(words.length / 2);
            line1 = words.slice(0, mid).join(' ');
            line2 = words.slice(mid).join(' ');
          }

          const renderHeadlineLine = (text, yPos, color, glowColor) => {
            ctx.shadowColor = glowColor || 'rgba(0,0,0,0.85)';
            ctx.shadowBlur = 18;

            // Dark Outline Stroke
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 14;
            ctx.lineJoin = 'miter';
            ctx.miterLimit = 2;
            ctx.strokeText(text, canvas.width / 2, yPos);

            // Radiant Fill
            ctx.fillStyle = color;
            ctx.fillText(text, canvas.width / 2, yPos);
          };

          renderHeadlineLine(
            line1,
            headlineY,
            '#FBBF24',
            'rgba(251, 191, 36, 0.7)'
          ); // Radiant Gold
          if (line2) {
            renderHeadlineLine(
              line2,
              headlineY + 85,
              '#FFFFFF',
              'rgba(255, 255, 255, 0.6)'
            ); // Clean White
          }
          ctx.restore();
        }

        // 5. Draw Bottom Center Naat Reciter Name in Kumail Urdu Font (No black opacity background)
        const activeBottom = (bottomText || subline || '').trim();
        if (activeBottom) {
          ctx.save();
          const isUrduBottom =
            /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
              activeBottom
            );
          const subY = canvas.height - 230;

          ctx.font = isUrduBottom
            ? `900 56px ${kumailFont}`
            : '900 42px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const displayQuote =
            activeBottom.length > 60
              ? activeBottom.slice(0, 58) + '...'
              : activeBottom;

          // Crisp outline stroke & shadow directly over video without black background box
          ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
          ctx.shadowBlur = 18;
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 14;
          ctx.lineJoin = 'miter';
          ctx.miterLimit = 2;
          ctx.strokeText(displayQuote, canvas.width / 2, subY);

          // Render text centered at bottom in Kumail Font
          ctx.fillStyle = '#FDE047'; // Radiant Gold
          ctx.fillText(displayQuote, canvas.width / 2, subY);
          ctx.restore();
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Failed to render AI thumbnail:', err);
        resolve(null);
      }
    };

    // Mode A: Video Element provided
    if (videoElement) {
      const seekTime = Math.max(0, timestamp);
      const onSeekComplete = () => {
        try {
          const vw = videoElement.videoWidth || 1920;
          const vh = videoElement.videoHeight || 1080;
          const cropW = Math.round(vh * (9 / 16));
          const cx = Math.round((vw - cropW) / 2); // centered subject crop

          ctx.drawImage(
            videoElement,
            cx,
            0,
            cropW,
            vh,
            0,
            0,
            canvas.width,
            canvas.height
          );
          drawOverlaysAndResolve();
        } catch {
          // If security error / tainted canvas, draw stylish gradient backdrop
          drawGradientBackdrop(ctx, canvas.width, canvas.height);
          drawOverlaysAndResolve();
        }
      };

      if (Math.abs(videoElement.currentTime - seekTime) < 0.2) {
        onSeekComplete();
      } else {
        videoElement.addEventListener('seeked', onSeekComplete, { once: true });
        videoElement.currentTime = seekTime;
      }
      return;
    }

    // Mode B: Direct Image URL provided (e.g. YouTube maxres/hq thumbnail)
    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const iw = img.naturalWidth || 1280;
          const ih = img.naturalHeight || 720;
          const cropW = Math.round(ih * (9 / 16));
          const cx = Math.max(0, Math.round((iw - cropW) / 2));

          ctx.drawImage(
            img,
            cx,
            0,
            cropW,
            ih,
            0,
            0,
            canvas.width,
            canvas.height
          );
          drawOverlaysAndResolve();
        } catch {
          drawGradientBackdrop(ctx, canvas.width, canvas.height);
          drawOverlaysAndResolve();
        }
      };
      img.onerror = () => {
        drawGradientBackdrop(ctx, canvas.width, canvas.height);
        drawOverlaysAndResolve();
      };
      img.src = imageUrl;
      return;
    }

    // Mode C: Fallback backdrop
    drawGradientBackdrop(ctx, canvas.width, canvas.height);
    drawOverlaysAndResolve();
  });
}

function drawGradientBackdrop(ctx, width, height) {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#064e3b'); // Rich Emerald
  bg.addColorStop(0.5, '#0f766e'); // Teal
  bg.addColorStop(1, '#1e293b'); // Deep Navy
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
}
