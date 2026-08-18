'use client';

/**
 * Cover Page Engine - Professional Branded First Page for All Useful Tools
 * - Crisp vector shapes & typography using pdf-lib
 * - Clean modern styling
 * - 100% compliant clickable PDF link annotations
 */
import { PDFDocument, rgb, StandardFonts, PDFName, PDFString } from 'pdf-lib';

// ── Colors ────────────────────────────────────────────────────────
const BLACK = rgb(0.1, 0.1, 0.1);
const PRIMARY_BLUE = rgb(0.15, 0.45, 0.95); // #2563eb
const DARK_GRAY = rgb(0.15, 0.15, 0.15); // #262626
const WHITE = rgb(1, 1, 1);
const TEXT_DARK = rgb(0.18, 0.18, 0.18);
const TEXT_MUTED = rgb(0.4, 0.4, 0.4);

const W = 612; // Letter width (pt)
const H = 792; // Letter height (pt)

// ── Helper: Add robust PDF Link Annotation ────────────────────────
function addLinkAnnotation(pdfDoc, page, rect, url) {
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
}

// ── Helper: Draw Circle ───────────────────────────────────────────
function drawCircle(page, cx, cy, r, color) {
  page.drawEllipse({
    x: cx,
    y: cy,
    xScale: r,
    yScale: r,
    color: color,
  });
}

// ── Helper: Draw Icon Badges ──────────────────────────────────────
function drawPhoneBadge(page, cx, cy, r) {
  drawCircle(page, cx, cy, r, PRIMARY_BLUE);
  drawCircle(page, cx, cy, r * 0.45, WHITE);
}

function drawEnvelopeBadge(page, cx, cy, r) {
  drawCircle(page, cx, cy, r, PRIMARY_BLUE);
  page.drawRectangle({
    x: cx - r * 0.45,
    y: cy - r * 0.3,
    width: r * 0.9,
    height: r * 0.6,
    color: WHITE,
  });
}

function drawGlobeBadge(page, cx, cy, r) {
  drawCircle(page, cx, cy, r, PRIMARY_BLUE);
  page.drawEllipse({
    x: cx,
    y: cy,
    xScale: r * 0.45,
    yScale: r * 0.45,
    borderColor: WHITE,
    borderWidth: 1.2,
  });
}

// ── MAIN GENERATOR ────────────────────────────────────────────────
export async function generateCoverPagePdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([W, H]);

  // Fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontBoldItalic = await pdfDoc.embedFont(
    StandardFonts.HelveticaBoldOblique
  );

  // ════════════════════════════════════════════════════════════════
  //  1. HEADER SECTION
  // ════════════════════════════════════════════════════════════════
  const headerH = 88;
  const headerY = H - headerH; // 704

  // Dark background on the right side
  page.drawRectangle({
    x: 0,
    y: headerY,
    width: W,
    height: headerH,
    color: BLACK,
  });

  // Blue Left Polygon
  page.drawSvgPath(`M 0 ${H} L 355 ${H} L 295 ${headerY} L 0 ${headerY} Z`, {
    color: PRIMARY_BLUE,
  });

  // Lower decorative bar & accent stripe
  page.drawSvgPath(
    `M 0 ${headerY - 4} L 285 ${headerY - 4} L 273 ${headerY - 14} L 0 ${headerY - 14} Z`,
    {
      color: BLACK,
    }
  );
  page.drawSvgPath(
    `M 292 ${headerY - 4} L 390 ${headerY - 4} L 378 ${headerY - 14} L 280 ${headerY - 14} Z`,
    {
      color: PRIMARY_BLUE,
    }
  );

  // ── Brand Text (left on blue) ─────────────────────────────
  page.drawText('ALL USEFUL TOOLS', {
    x: 24,
    y: H - 42,
    size: 18,
    font: fontBold,
    color: WHITE,
  });

  // Clickable link on header brand
  addLinkAnnotation(
    pdfDoc,
    page,
    [18, H - 68, 280, H - 10],
    'https://hazwoper-useful-tools.vercel.app'
  );

  // ── Tagline under logo ─────────
  page.drawText('All-in-One Online Productivity & Media Utilities', {
    x: 24,
    y: H - 62,
    size: 8.5,
    font: fontBold,
    color: WHITE,
  });

  // ── Right Contact Column (Phone, Email, Web) ────────────────
  const rightMargin = W - 18;

  // Email
  const emailText = 'support@hazwoper-useful-tools.com';
  const emailW = fontRegular.widthOfTextAtSize(emailText, 9.5);
  const emailY = H - 36;
  drawEnvelopeBadge(page, rightMargin - emailW - 14, emailY + 3, 7.5);
  page.drawText(emailText, {
    x: rightMargin - emailW,
    y: emailY,
    size: 9.5,
    font: fontRegular,
    color: WHITE,
  });
  addLinkAnnotation(
    pdfDoc,
    page,
    [rightMargin - emailW - 24, emailY - 4, rightMargin, emailY + 12],
    'mailto:support@hazwoper-useful-tools.com'
  );

  // Website
  const webText = 'all-useful-tools.app';
  const webW = fontRegular.widthOfTextAtSize(webText, 9.5);
  const webY = H - 60;
  drawGlobeBadge(page, rightMargin - webW - 14, webY + 3, 7.5);
  page.drawText(webText, {
    x: rightMargin - webW,
    y: webY,
    size: 9.5,
    font: fontRegular,
    color: WHITE,
  });
  addLinkAnnotation(
    pdfDoc,
    page,
    [rightMargin - webW - 24, webY - 4, rightMargin, webY + 12],
    'https://hazwoper-useful-tools.vercel.app'
  );

  // ════════════════════════════════════════════════════════════════
  //  2. ELEGANT BODY CONTENT
  // ════════════════════════════════════════════════════════════════
  const marginX = 50;
  const contentWidth = W - marginX * 2;
  let curY = headerY - 32;

  // ── Main Page Header ────────────────────────────────────────
  const mainTitle = 'Professional Document Suite';
  const mainTitleW = fontBold.widthOfTextAtSize(mainTitle, 22);
  page.drawText(mainTitle, {
    x: (W - mainTitleW) / 2,
    y: curY,
    size: 22,
    font: fontBold,
    color: TEXT_DARK,
  });
  curY -= 8;

  // Center accent line
  page.drawRectangle({
    x: (W - 140) / 2,
    y: curY,
    width: 140,
    height: 3,
    color: PRIMARY_BLUE,
  });
  curY -= 22;

  const subtitle =
    'High-Performance PDF Editing, Media Conversion & Content Automation';
  const subW = fontItalic.widthOfTextAtSize(subtitle, 11);
  page.drawText(subtitle, {
    x: (W - subW) / 2,
    y: curY,
    size: 11,
    font: fontItalic,
    color: TEXT_MUTED,
  });
  curY -= 36;

  // ── Section 1: Executive Overview ───────────────────────────
  curY = drawSectionHeading(
    page,
    'ABOUT ALL USEFUL TOOLS',
    marginX,
    curY,
    fontBold
  );
  const aboutText =
    'All Useful Tools is a modern browser-powered digital workstation designed for creators, developers, and professionals. By executing file transformations, PDF editing, and media processing directly inside your browser using WebAssembly, we provide lightning-fast results while guaranteeing 100% data privacy.';
  curY = drawParagraph(
    page,
    aboutText,
    marginX,
    curY,
    contentWidth,
    fontRegular,
    9.5,
    14.5
  );
  curY -= 20;

  // ── Section 2: Core Capabilities ────────
  curY = drawSectionHeading(
    page,
    'SUITE CAPABILITIES & WORKFLOW UTILITIES',
    marginX,
    curY,
    fontBold
  );

  const col1Bullets = [
    'Free Interactive PDF Editor & Page Reordering',
    'High-Fidelity Audio & Video Format Converters',
    'Intelligent OCR & Document Text Extraction',
  ];
  const col2Bullets = [
    'Instant AI Watermark & Background Removal',
    'Clean HTML5 & Code Formatting Automation',
    'Zero Server Uploads & 100% Local Browser Privacy',
  ];

  const colW = (contentWidth - 20) / 2;
  const col1X = marginX;
  const col2X = marginX + colW + 20;
  const startBulY = curY;

  let bulY1 = startBulY;
  col1Bullets.forEach((b) => {
    drawCircle(page, col1X + 5, bulY1 + 3, 2.5, PRIMARY_BLUE);
    bulY1 = drawParagraph(
      page,
      b,
      col1X + 14,
      bulY1,
      colW - 14,
      fontRegular,
      9,
      13.5
    );
    bulY1 -= 4;
  });

  let bulY2 = startBulY;
  col2Bullets.forEach((b) => {
    drawCircle(page, col2X + 5, bulY2 + 3, 2.5, PRIMARY_BLUE);
    bulY2 = drawParagraph(
      page,
      b,
      col2X + 14,
      bulY2,
      colW - 14,
      fontRegular,
      9,
      13.5
    );
    bulY2 -= 4;
  });

  curY = Math.min(bulY1, bulY2) - 18;

  // ── Section 3: Privacy & Performance ───────────────────────
  curY = drawSectionHeading(
    page,
    'PRIVACY & CLIENT-SIDE ARCHITECTURE',
    marginX,
    curY,
    fontBold
  );
  const supportText =
    'All tools run locally in your client environment. No server round-trips, no third-party data tracking, and zero latency. For technical questions or feature suggestions, visit our online platform or contact our support team.';
  curY = drawParagraph(
    page,
    supportText,
    marginX,
    curY,
    contentWidth,
    fontRegular,
    9.5,
    14.5
  );

  // ════════════════════════════════════════════════════════════════
  //  3. FOOTER SECTION
  // ════════════════════════════════════════════════════════════════
  const footerH = 110;

  // Dark gray background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: footerH,
    color: DARK_GRAY,
  });

  // Top accent line
  page.drawRectangle({
    x: 0,
    y: footerH - 3,
    width: W,
    height: 3,
    color: PRIMARY_BLUE,
  });

  // ── Services Column 1 ───────────────────────────────────────
  const footCol1X = 36;
  const services1 = [
    'PDF Editor & Annotation',
    'Media & Video Converters',
    'Smart OCR Document Extraction',
  ];
  services1.forEach((text, i) => {
    const sy = footerH - 24 - i * 18;
    drawCircle(page, footCol1X + 5, sy + 3, 4.5, PRIMARY_BLUE);
    page.drawText(text, {
      x: footCol1X + 15,
      y: sy,
      size: 8.5,
      font: fontBold,
      color: WHITE,
    });
  });

  // ── Services Column 2 ───────────────────────────────────────
  const footCol2X = 230;
  const services2 = [
    'Audio Waveform Editor',
    'Background & Watermark Eraser',
    'HTML Code Sanitizer',
  ];
  services2.forEach((text, i) => {
    const sy = footerH - 24 - i * 18;
    drawCircle(page, footCol2X + 5, sy + 3, 4.5, PRIMARY_BLUE);
    page.drawText(text, {
      x: footCol2X + 15,
      y: sy,
      size: 8.5,
      font: fontBold,
      color: WHITE,
    });
  });

  // ── Bottom Accent Bar with Tagline ──────────────────
  const taglineText = 'All Useful Tools — Fast, Private, and Universal.';
  const tagW = fontBoldItalic.widthOfTextAtSize(taglineText, 10);

  page.drawSvgPath(`M 150 20 L 462 20 L 442 0 L 170 0 Z`, {
    color: PRIMARY_BLUE,
  });

  page.drawText(taglineText, {
    x: (W - tagW) / 2,
    y: 5,
    size: 10,
    font: fontBoldItalic,
    color: WHITE,
  });

  addLinkAnnotation(
    pdfDoc,
    page,
    [150, 0, 462, 20],
    'https://hazwoper-useful-tools.vercel.app'
  );

  // ── Save & Return Buffer ────────────────────────────────────
  const pdfBytes = await pdfDoc.save();
  return pdfBytes.buffer;
}

// ── Helper: Draw Section Heading with Left Pill Accent ────────────
function drawSectionHeading(page, title, x, y, fontBold) {
  page.drawRectangle({
    x: x,
    y: y - 2,
    width: 4,
    height: 14,
    color: PRIMARY_BLUE,
  });

  page.drawText(title, {
    x: x + 12,
    y: y,
    size: 11.5,
    font: fontBold,
    color: TEXT_DARK,
  });

  return y - 18;
}

// ── Helper: Draw Paragraph with Word-Wrap ─────────────────────────
function drawParagraph(page, text, x, y, maxWidth, font, fontSize, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxWidth && line) {
      page.drawText(line, {
        x: x,
        y: curY,
        size: fontSize,
        font: font,
        color: TEXT_DARK,
      });
      line = word;
      curY -= lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    page.drawText(line, {
      x: x,
      y: curY,
      size: fontSize,
      font: font,
      color: TEXT_DARK,
    });
    curY -= lineHeight;
  }

  return curY;
}
