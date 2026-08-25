/**
 * @file watermark-util.js
 * Utility to automatically stamp the system logo / watermark badge
 * on the bottom right of uploaded images via HTML5 Canvas.
 */

export async function stampSystemLogoOnImage(imageSource, options = {}) {
  const {
    logoText = 'HAZWOPER ALL USEFUL TOOLS',
    subText = 'OFFICIAL SAFETY TRAINING',
    badgeColor = '#d97706', // amber-600
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(
            typeof imageSource === 'string'
              ? imageSource
              : URL.createObjectURL(imageSource)
          );
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Watermark proportions based on image size
        const scale = Math.max(canvas.width / 1200, 0.6);
        const padding = 20 * scale;
        const boxWidth = Math.min(320 * scale, canvas.width * 0.45);
        const boxHeight = 54 * scale;
        const x = canvas.width - boxWidth - padding;
        const y = canvas.height - boxHeight - padding;
        const radius = 10 * scale;

        // Draw badge background
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'; // Dark slate with opacity
        ctx.strokeStyle = badgeColor;
        ctx.lineWidth = 1.5 * scale;

        // Rounded rect
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + boxWidth - radius, y);
        ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
        ctx.lineTo(x + boxWidth, y + boxHeight - radius);
        ctx.quadraticCurveTo(
          x + boxWidth,
          y + boxHeight,
          x + boxWidth - radius,
          y + boxHeight
        );
        ctx.lineTo(x + radius, y + boxHeight);
        ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Accent tag bar on left of badge
        ctx.fillStyle = badgeColor;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + 6 * scale, y);
        ctx.lineTo(x + 6 * scale, y + boxHeight);
        ctx.lineTo(x + radius, y + boxHeight);
        ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        // Primary text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(13 * scale)}px sans-serif`;
        ctx.fillText(logoText, x + 16 * scale, y + 23 * scale);

        // Sub text
        ctx.fillStyle = '#94a3b8';
        ctx.font = `bold ${Math.round(9 * scale)}px sans-serif`;
        ctx.fillText(subText, x + 16 * scale, y + 42 * scale);

        // Shield dot / mark
        ctx.fillStyle = badgeColor;
        ctx.beginPath();
        ctx.arc(
          x + boxWidth - 18 * scale,
          y + boxHeight / 2,
          5 * scale,
          0,
          2 * Math.PI
        );
        ctx.fill();

        ctx.restore();

        // Return as high-quality data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Canvas watermark stamping failed:', err);
        resolve(
          typeof imageSource === 'string'
            ? imageSource
            : URL.createObjectURL(imageSource)
        );
      }
    };

    img.onerror = (err) => {
      console.warn('Failed to load image for watermarking:', err);
      resolve(typeof imageSource === 'string' ? imageSource : '');
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof Blob || imageSource instanceof File) {
      img.src = URL.createObjectURL(imageSource);
    } else {
      resolve('');
    }
  });
}
