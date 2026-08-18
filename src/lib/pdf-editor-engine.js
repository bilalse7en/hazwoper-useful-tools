import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
  PDFName,
  PDFString,
} from 'pdf-lib';

export const PAGE_SIZES = {
  letter: { name: 'Letter (8.5" x 11")', width: 612, height: 792 },
  a4: { name: 'A4 (210mm x 297mm)', width: 595.28, height: 841.89 },
  legal: { name: 'Legal (8.5" x 14")', width: 612, height: 1008 },
  executive: { name: 'Executive', width: 522, height: 756 },
};

/**
 * Creates a blank PDF ArrayBuffer with specified options.
 */
export async function createBlankPdf({
  pageSize = 'letter',
  orientation = 'portrait',
  pageCount = 1,
  bgColor = '#ffffff',
} = {}) {
  const pdfDoc = await PDFDocument.create();
  const baseSize = PAGE_SIZES[pageSize] || PAGE_SIZES.letter;
  const width = orientation === 'landscape' ? baseSize.height : baseSize.width;
  const height = orientation === 'landscape' ? baseSize.width : baseSize.height;

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.addPage([width, height]);

    if (bgColor && bgColor !== '#ffffff') {
      const hex = bgColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(r, g, b),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes.buffer;
}

/**
 * Helper to parse hex color to RGB (0-1 range for pdf-lib)
 */
function hexToRgb(hexString) {
  if (!hexString || hexString === 'transparent') return null;
  let hex = hexString.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;
  return rgb(r, g, b);
}

/**
 * Helper to convert data URL to Uint8Array
 */
function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function addPdfLinkAnnotation(pdfDoc, page, rect, url) {
  try {
    const linkAnnot = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: rect,
      Border: [0, 0, 0],
      C: [0, 0, 0],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of(url),
      },
    });
    const linkAnnotRef = pdfDoc.context.register(linkAnnot);
    let annots = page.node.get(PDFName.of('Annots'));
    if (!annots) {
      annots = pdfDoc.context.array();
      page.node.set(PDFName.of('Annots'), annots);
    }
    annots.push(linkAnnotRef);
  } catch (err) {
    console.warn('Failed to add PDF link annotation:', err);
  }
}

export function attachCoverPageLinkAnnotations(pdfDoc, page) {
  const { width: W, height: H } = page.getSize();
  const footerH = 136;

  // Header Logo link
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [18, H - 68, 280, H - 10],
    'https://hazwoper-osha.com'
  );

  // Phone link
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [440, H - 28, W - 18, H - 12],
    'tel:1-866-429-6742'
  );

  // Email link
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [440, H - 50, W - 18, H - 34],
    'mailto:info@hazwoper-osha.com'
  );

  // Website Header link
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [440, H - 72, W - 18, H - 56],
    'https://hazwoper-osha.com'
  );

  // QR Code link
  const qrX = 18;
  const qrY = 36;
  const qrSize = 74;
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [qrX - 4, qrY - 4, qrX + qrSize + 4, qrY + qrSize + 4],
    'https://hazwoper-osha.com'
  );

  // Services Column 1
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [114, 30, 284, footerH - 15],
    'https://hazwoper-osha.com/online-courses'
  );

  // Services Column 2
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [300, 30, 460, footerH - 15],
    'https://hazwoper-osha.com/online-courses'
  );

  // Address block link
  const addrX = 472;
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [addrX, footerH - 55, W - 10, footerH - 10],
    'https://hazwoper-osha.com/contact-us'
  );

  // Social Links (LinkedIn, Facebook, YouTube, Instagram, Twitter, Pinterest)
  const socialY = 48;
  const socialR = 8.5;
  const socialStartX = 472;
  const socialGap = 22;

  // 1. LinkedIn
  const liX = socialStartX;
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [liX - socialR, socialY - socialR, liX + socialR, socialY + socialR],
    'https://www.linkedin.com/company/hazwoper-osha/'
  );

  // 2. Facebook
  const fbX = socialStartX + socialGap;
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [fbX - socialR, socialY - socialR, fbX + socialR, socialY + socialR],
    'https://www.facebook.com/HazwoperOsha'
  );

  // 3. YouTube
  const ytX = socialStartX + socialGap * 2;
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [ytX - socialR, socialY - socialR, ytX + socialR, socialY + socialR],
    'https://www.youtube.com/@hazwoper-osha'
  );

  // 4. Instagram
  const igX = socialStartX + socialGap * 3;
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [igX - socialR, socialY - socialR, igX + socialR, socialY + socialR],
    'https://www.instagram.com/hazwoper_osha_training/'
  );

  // 5. Twitter / X
  const twX = socialStartX + socialGap * 4;
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [twX - socialR, socialY - socialR, twX + socialR, socialY + socialR],
    'https://twitter.com/HazwoperOsha/'
  );

  // 6. Pinterest
  const pinX = socialStartX + socialGap * 5;
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [pinX - socialR, socialY - socialR, pinX + socialR, socialY + socialR],
    'https://www.pinterest.com/HazwoperOsha/'
  );

  // Tagline Bar link
  addPdfLinkAnnotation(
    pdfDoc,
    page,
    [150, 0, 462, 22],
    'https://www.hazwoper-osha.com'
  );
}

/**
 * Exports modified PDF combining page modifications and overlay layers.
 *
 * @param {Object} options
 * @param {ArrayBuffer} options.originalArrayBuffer
 * @param {Array} options.pagesConfig List of page objects: { id, originalPageIndex, isNew, rotation, width, height, bgColor, isCoverPage }
 * @param {Object} options.overlaysMap Map of pageId -> Array of overlay elements
 */
export async function exportModifiedPdf({
  originalArrayBuffer,
  pagesConfig,
  overlaysMap = {},
}) {
  let sourceDoc = null;
  if (originalArrayBuffer) {
    sourceDoc = await PDFDocument.load(originalArrayBuffer.slice(0), {
      ignoreEncryption: true,
    });
  }

  const outputDoc = await PDFDocument.create();

  // Embed standard fonts for text overlays
  const fontHelvetica = await outputDoc.embedStandardFont(
    StandardFonts.Helvetica
  );
  const fontHelveticaBold = await outputDoc.embedStandardFont(
    StandardFonts.HelveticaBold
  );
  const fontTimes = await outputDoc.embedStandardFont(StandardFonts.TimesRoman);
  const fontCourier = await outputDoc.embedStandardFont(StandardFonts.Courier);

  const getFont = (family, weight) => {
    if (family?.includes('Times')) return fontTimes;
    if (family?.includes('Courier')) return fontCourier;
    if (weight === 'bold' || weight === '700' || weight === 700) {
      return fontHelveticaBold;
    }
    return fontHelvetica;
  };

  for (const pageConfig of pagesConfig) {
    let page;

    if (
      sourceDoc &&
      !pageConfig.isNew &&
      typeof pageConfig.originalPageIndex === 'number'
    ) {
      const [copiedPage] = await outputDoc.copyPages(sourceDoc, [
        pageConfig.originalPageIndex,
      ]);
      page = outputDoc.addPage(copiedPage);
    } else {
      const w = pageConfig.width || 612;
      const h = pageConfig.height || 792;
      page = outputDoc.addPage([w, h]);

      if (pageConfig.bgColor && pageConfig.bgColor !== '#ffffff') {
        const bgRgb = hexToRgb(pageConfig.bgColor);
        if (bgRgb) {
          page.drawRectangle({
            x: 0,
            y: 0,
            width: w,
            height: h,
            color: bgRgb,
          });
        }
      }
    }

    // Attach cover page links if this page is a cover page
    if (pageConfig.isCoverPage || pageConfig.id?.includes('cover')) {
      attachCoverPageLinkAnnotations(outputDoc, page);
    }

    if (pageConfig.rotation) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + pageConfig.rotation) % 360));
    }

    const { width: pageWidth, height: pageHeight } = page.getSize();
    const overlays = overlaysMap[pageConfig.id] || [];

    for (const item of overlays) {
      if (!item.visible && item.visible !== undefined) continue;

      const opacity = item.opacity !== undefined ? item.opacity : 1;

      // 1. TEXT OVERLAY
      if (item.type === 'text') {
        const font = getFont(item.fontFamily, item.fontWeight);
        const fontSize = Number(item.fontSize) || 16;
        const textColor = hexToRgb(item.color || '#000000') || rgb(0, 0, 0);

        // Convert canvas overlay Y (top-left) to PDF Y (bottom-left)
        // item.x and item.y are normalized to page dimensions or in points
        const itemWidth = item.width || 200;
        const itemHeight = item.height || fontSize * 1.5;

        // Draw background if specified
        if (item.bgColor && item.bgColor !== 'transparent') {
          const bgRgb = hexToRgb(item.bgColor);
          if (bgRgb) {
            page.drawRectangle({
              x: item.x,
              y: pageHeight - item.y - itemHeight,
              width: itemWidth,
              height: itemHeight,
              color: bgRgb,
              opacity: opacity,
            });
          }
        }

        const lines = (item.text || '').split('\n');
        let currentY = pageHeight - item.y - fontSize * 0.9;

        for (const line of lines) {
          if (line.trim() !== '') {
            let lineX = item.x;
            if (item.textAlign === 'center' || item.textAlign === 'right') {
              const textWidth = font.widthOfTextAtSize(line, fontSize);
              if (item.textAlign === 'center') {
                lineX = item.x + Math.max(0, (itemWidth - textWidth) / 2);
              } else if (item.textAlign === 'right') {
                lineX = item.x + Math.max(0, itemWidth - textWidth);
              }
            }

            page.drawText(line, {
              x: lineX,
              y: currentY,
              size: fontSize,
              font: font,
              color: textColor,
              opacity: opacity,
            });
          }
          currentY -= fontSize * 1.25;
        }
      }

      // 2. WHITEOUT / REDACTION
      else if (item.type === 'whiteout' || item.type === 'redact') {
        const rectColor =
          item.type === 'redact'
            ? rgb(0, 0, 0)
            : hexToRgb(item.color || '#ffffff') || rgb(1, 1, 1);
        page.drawRectangle({
          x: item.x,
          y: pageHeight - item.y - item.height,
          width: item.width,
          height: item.height,
          color: rectColor,
          opacity: opacity,
        });
      }

      // 3. SHAPES (RECTANGLE, CIRCLE, LINE, ARROW)
      else if (item.type === 'shape') {
        const fillColor = hexToRgb(item.fillColor);
        const strokeColor = hexToRgb(item.strokeColor || '#000000');
        const borderWidth = Number(item.borderWidth) || 2;

        if (item.shapeType === 'rectangle') {
          page.drawRectangle({
            x: item.x,
            y: pageHeight - item.y - item.height,
            width: item.width,
            height: item.height,
            color: fillColor || undefined,
            borderColor: strokeColor || undefined,
            borderWidth: strokeColor ? borderWidth : 0,
            opacity: opacity,
          });
        } else if (item.shapeType === 'circle') {
          const rx = item.width / 2;
          const ry = item.height / 2;
          const cx = item.x + rx;
          const cy = pageHeight - item.y - ry;
          page.drawEllipse({
            x: cx,
            y: cy,
            xScale: rx,
            yScale: ry,
            color: fillColor || undefined,
            borderColor: strokeColor || undefined,
            borderWidth: strokeColor ? borderWidth : 0,
            opacity: opacity,
          });
        } else if (item.shapeType === 'line' || item.shapeType === 'arrow') {
          const startX = item.x;
          const startY = pageHeight - item.y;
          const endX = item.x + item.width;
          const endY = pageHeight - (item.y + item.height);

          page.drawLine({
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
            thickness: borderWidth,
            color: strokeColor || rgb(0, 0, 0),
            opacity: opacity,
          });

          // Draw arrowhead if arrow shape
          if (item.shapeType === 'arrow') {
            const angle = Math.atan2(endY - startY, endX - startX);
            const headLen = 12;
            const arrow1X = endX - headLen * Math.cos(angle - Math.PI / 6);
            const arrow1Y = endY - headLen * Math.sin(angle - Math.PI / 6);
            const arrow2X = endX - headLen * Math.cos(angle + Math.PI / 6);
            const arrow2Y = endY - headLen * Math.sin(angle + Math.PI / 6);

            page.drawLine({
              start: { x: endX, y: endY },
              end: { x: arrow1X, y: arrow1Y },
              thickness: borderWidth,
              color: strokeColor || rgb(0, 0, 0),
              opacity: opacity,
            });
            page.drawLine({
              start: { x: endX, y: endY },
              end: { x: arrow2X, y: arrow2Y },
              thickness: borderWidth,
              color: strokeColor || rgb(0, 0, 0),
              opacity: opacity,
            });
          }
        }
      }

      // 4. IMAGE / STAMP / SIGNATURE / DRAWING CANVAS SNAPSHOT
      else if (
        (item.type === 'image' ||
          item.type === 'stamp' ||
          item.type === 'signature' ||
          item.type === 'drawing') &&
        item.src
      ) {
        try {
          const imageBytes = dataUrlToUint8Array(item.src);
          let embeddedImage;
          if (
            item.src.startsWith('data:image/jpeg') ||
            item.src.startsWith('data:image/jpg')
          ) {
            embeddedImage = await outputDoc.embedJpg(imageBytes);
          } else {
            embeddedImage = await outputDoc.embedPng(imageBytes);
          }

          const imgWidth = item.width || embeddedImage.width;
          const imgHeight = item.height || embeddedImage.height;
          const pdfY = pageHeight - item.y - imgHeight;

          page.drawImage(embeddedImage, {
            x: item.x,
            y: pdfY,
            width: imgWidth,
            height: imgHeight,
            opacity: opacity,
            rotate: item.rotation ? degrees(item.rotation) : degrees(0),
          });
        } catch (err) {
          console.error('Failed to embed image overlay in PDF export:', err);
        }
      }
    }
  }

  const pdfBytes = await outputDoc.save();
  return pdfBytes.buffer;
}
