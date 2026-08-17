'use client';

/**
 * Cover Page Engine v3 - Professional HAZWOPER-OSHA Branded First Page
 * - Pixel-perfect match to reference design
 * - Real embedded brand logo and biohazard QR code images
 * - Crisp vector shapes & typography using pdf-lib
 * - 100% compliant clickable PDF link annotations (phone, email, website, social links)
 */
import { PDFDocument, rgb, StandardFonts, PDFName, PDFString } from 'pdf-lib';

// ── Colors ────────────────────────────────────────────────────────
const BLACK = rgb(0.1, 0.1, 0.1);
const YELLOW = rgb(0.96, 0.72, 0);         // #f5b800 (HAZWOPER Brand Yellow)
const DARK_GRAY = rgb(0.15, 0.15, 0.15);   // #262626
const WHITE = rgb(1, 1, 1);
const TEXT_DARK = rgb(0.18, 0.18, 0.18);
const TEXT_MUTED = rgb(0.4, 0.4, 0.4);

const W = 612;  // Letter width (pt)
const H = 792;  // Letter height (pt)

// ── Helper: Fetch public image as Uint8Array ──────────────────────
async function fetchImageBytes(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// ── Helper: Add robust PDF Link Annotation ────────────────────────
function addLinkAnnotation(pdfDoc, page, rect, url) {
  // rect is [xMin, yMin, xMax, yMax]
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
  drawCircle(page, cx, cy, r, YELLOW);
  drawCircle(page, cx, cy, r * 0.45, BLACK);
}

function drawEnvelopeBadge(page, cx, cy, r) {
  drawCircle(page, cx, cy, r, YELLOW);
  page.drawRectangle({
    x: cx - r * 0.45,
    y: cy - r * 0.3,
    width: r * 0.9,
    height: r * 0.6,
    color: BLACK,
  });
}

function drawGlobeBadge(page, cx, cy, r) {
  drawCircle(page, cx, cy, r, YELLOW);
  page.drawEllipse({
    x: cx,
    y: cy,
    xScale: r * 0.45,
    yScale: r * 0.45,
    borderColor: BLACK,
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
  const fontBoldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  // Load images
  let logoImage, qrImage;
  try {
    const logoBytes = await fetchImageBytes('/hazwoper-logo.png');
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch (err) {
    console.warn('Could not load logo PNG:', err);
  }

  try {
    const qrBytes = await fetchImageBytes('/hazwoper-qrcode.png');
    qrImage = await pdfDoc.embedPng(qrBytes);
  } catch (err) {
    console.warn('Could not load QR code PNG:', err);
  }

  // ════════════════════════════════════════════════════════════════
  //  1. HEADER SECTION
  // ════════════════════════════════════════════════════════════════
  const headerH = 88;
  const headerY = H - headerH; // 704

  // Black background on the right side
  page.drawRectangle({
    x: 0,
    y: headerY,
    width: W,
    height: headerH,
    color: BLACK,
  });

  // Yellow Left Polygon (M 0 792 L 355 792 L 295 704 L 0 704 Z)
  page.drawSvgPath(`M 0 ${H} L 355 ${H} L 295 ${headerY} L 0 ${headerY} Z`, {
    color: YELLOW,
  });

  // Yellow lower decorative bar & accent stripe
  page.drawSvgPath(`M 0 ${headerY - 4} L 285 ${headerY - 4} L 273 ${headerY - 14} L 0 ${headerY - 14} Z`, {
    color: BLACK,
  });
  page.drawSvgPath(`M 292 ${headerY - 4} L 390 ${headerY - 4} L 378 ${headerY - 14} L 280 ${headerY - 14} Z`, {
    color: YELLOW,
  });

  // ── Logo Image (left on yellow) ─────────────────────────────
  if (logoImage) {
    const aspect = logoImage.width / logoImage.height;
    const logoH = 42;
    const logoW = logoH * aspect;
    page.drawImage(logoImage, {
      x: 18,
      y: H - 52,
      width: logoW,
      height: logoH,
    });
  }

  // Clickable link on header logo
  addLinkAnnotation(pdfDoc, page, [18, H - 68, 280, H - 10], 'https://www.hazwoper-osha.com');

  // ── Tagline under logo (crisp bold black on yellow) ─────────
  page.drawText('Industrial Safety. Regulatory Compliance. Workforce Protection.', {
    x: 18,
    y: H - 68,
    size: 7.5,
    font: fontBold,
    color: BLACK,
  });

  // ── Right Contact Column (Phone, Email, Web) ────────────────
  const rightMargin = W - 18;

  // Phone
  const phoneText = '1-866-429-6742';
  const phoneW = fontBold.widthOfTextAtSize(phoneText, 9.5);
  const phoneY = H - 24;
  drawPhoneBadge(page, rightMargin - phoneW - 14, phoneY + 3, 7.5);
  page.drawText(phoneText, {
    x: rightMargin - phoneW,
    y: phoneY,
    size: 9.5,
    font: fontBold,
    color: WHITE,
  });
  addLinkAnnotation(pdfDoc, page, [rightMargin - phoneW - 24, phoneY - 4, rightMargin, phoneY + 12], 'tel:1-866-429-6742');

  // Email
  const emailText = 'info@hazwoper-osha.com';
  const emailW = fontRegular.widthOfTextAtSize(emailText, 9.5);
  const emailY = H - 46;
  drawEnvelopeBadge(page, rightMargin - emailW - 14, emailY + 3, 7.5);
  page.drawText(emailText, {
    x: rightMargin - emailW,
    y: emailY,
    size: 9.5,
    font: fontRegular,
    color: WHITE,
  });
  addLinkAnnotation(pdfDoc, page, [rightMargin - emailW - 24, emailY - 4, rightMargin, emailY + 12], 'mailto:info@hazwoper-osha.com');

  // Website
  const webText = 'www.hazwoper-osha.com';
  const webW = fontRegular.widthOfTextAtSize(webText, 9.5);
  const webY = H - 68;
  drawGlobeBadge(page, rightMargin - webW - 14, webY + 3, 7.5);
  page.drawText(webText, {
    x: rightMargin - webW,
    y: webY,
    size: 9.5,
    font: fontRegular,
    color: WHITE,
  });
  addLinkAnnotation(pdfDoc, page, [rightMargin - webW - 24, webY - 4, rightMargin, webY + 12], 'https://hazwoper-osha.com');

  // ════════════════════════════════════════════════════════════════
  //  2. ELEGANT & SPACIOUS BODY CONTENT
  // ════════════════════════════════════════════════════════════════
  const marginX = 50;
  const contentWidth = W - marginX * 2;
  let curY = headerY - 32;

  // ── Main Page Header ────────────────────────────────────────
  const mainTitle = 'HAZWOPER-OSHA Training';
  const mainTitleW = fontBold.widthOfTextAtSize(mainTitle, 22);
  page.drawText(mainTitle, {
    x: (W - mainTitleW) / 2,
    y: curY,
    size: 22,
    font: fontBold,
    color: TEXT_DARK,
  });
  curY -= 8;

  // Center yellow accent line
  page.drawRectangle({
    x: (W - 140) / 2,
    y: curY,
    width: 140,
    height: 3,
    color: YELLOW,
  });
  curY -= 22;

  const subtitle = 'Your Trusted Partner in Industrial Safety & Regulatory Compliance';
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
  curY = drawSectionHeading(page, 'ABOUT HAZWOPER-OSHA', marginX, curY, fontBold);
  const aboutText =
    'HAZWOPER-OSHA Training is an IACET-accredited safety education provider delivering environmental, occupational health, and regulatory compliance programs nationwide. Operating under Industrial Certified Training (ICT), we empower employers to meet federal and state safety standards while improving operational performance in high-hazard environments.';
  curY = drawParagraph(page, aboutText, marginX, curY, contentWidth, fontRegular, 9.5, 14.5);
  curY -= 20;

  // ── Section 2: Core Capabilities & Training Programs ────────
  curY = drawSectionHeading(page, 'OUR TRAINING & COMPLIANCE SOLUTIONS', marginX, curY, fontBold);
  
  const col1Bullets = [
    'Over 1,000 Online, Virtual & Onsite Safety Courses',
    'HAZWOPER, OSHA 10/30, EPA, DOT & NFPA Credentialing',
    'AR/VR Simulation Modules for Confined Space & Hazmat',
  ];
  const col2Bullets = [
    'IACET Accredited Continuing Education Units (CEUs)',
    'SCORM 1.2 & 2004 Compliant LMS Integration Packages',
    'Enterprise Automated Compliance Tracking & Reporting',
  ];

  const colW = (contentWidth - 20) / 2;
  const col1X = marginX;
  const col2X = marginX + colW + 20;
  const startBulY = curY;

  let bulY1 = startBulY;
  col1Bullets.forEach((b) => {
    drawCircle(page, col1X + 5, bulY1 + 3, 2.5, YELLOW);
    bulY1 = drawParagraph(page, b, col1X + 14, bulY1, colW - 14, fontRegular, 9, 13.5);
    bulY1 -= 4;
  });

  let bulY2 = startBulY;
  col2Bullets.forEach((b) => {
    drawCircle(page, col2X + 5, bulY2 + 3, 2.5, YELLOW);
    bulY2 = drawParagraph(page, b, col2X + 14, bulY2, colW - 14, fontRegular, 9, 13.5);
    bulY2 -= 4;
  });

  curY = Math.min(bulY1, bulY2) - 18;

  // ── Section 3: 24/7 Dedicated Support ───────────────────────
  curY = drawSectionHeading(page, '24/7 WORKFORCE SUPPORT & CONSULTATION', marginX, curY, fontBold);
  const supportText =
    'Our team of senior EHS specialists brings over two decades of field experience. We offer year-round technical support, custom site-specific course development, and LMS storefront solutions. Contact our support line at 1-866-429-6742 or email info@hazwoper-osha.com for immediate assistance.';
  curY = drawParagraph(page, supportText, marginX, curY, contentWidth, fontRegular, 9.5, 14.5);

  // ════════════════════════════════════════════════════════════════
  //  3. FOOTER SECTION
  // ════════════════════════════════════════════════════════════════
  const footerH = 136;

  // Dark gray background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: footerH,
    color: DARK_GRAY,
  });

  // Top yellow line
  page.drawRectangle({
    x: 0,
    y: footerH - 3,
    width: W,
    height: 3,
    color: YELLOW,
  });

  // ── QR Code (left side) ─────────────────────────────────────
  if (qrImage) {
    const qrSize = 74;
    const qrX = 18;
    const qrY = 36;
    // White background card with yellow border
    page.drawRectangle({
      x: qrX - 4,
      y: qrY - 4,
      width: qrSize + 8,
      height: qrSize + 8,
      color: WHITE,
      borderColor: YELLOW,
      borderWidth: 2,
    });
    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });
    // Clickable QR Code link
    addLinkAnnotation(pdfDoc, page, [qrX - 4, qrY - 4, qrX + qrSize + 4, qrY + qrSize + 4], 'https://hazwoper-osha.com');
  }

  // ── Services Column 1 ───────────────────────────────────────
  const footCol1X = 114;
  const services1 = [
    'OSHA & HAZWOPER Training',
    'Online & Onsite Training',
    'Compliance & Consultation',
    'Learning Management System (LMS)',
  ];
  services1.forEach((text, i) => {
    const sy = footerH - 24 - i * 18;
    drawCircle(page, footCol1X + 5, sy + 3, 4.5, YELLOW);
    page.drawText(text, {
      x: footCol1X + 15,
      y: sy,
      size: 7.5,
      font: fontBold,
      color: WHITE,
    });
  });

  // Service column 1 clickable area
  addLinkAnnotation(pdfDoc, page, [footCol1X, 40, footCol1X + 170, footerH - 15], 'https://hazwoper-osha.com/online-courses');

  // ── Services Column 2 ───────────────────────────────────────
  const footCol2X = 300;
  const services2 = [
    'Confined Space Training',
    'Emergency Response Training',
    'Industrial Safety Programs',
    'And Much More',
  ];
  services2.forEach((text, i) => {
    const sy = footerH - 24 - i * 18;
    drawCircle(page, footCol2X + 5, sy + 3, 4.5, YELLOW);
    page.drawText(text, {
      x: footCol2X + 15,
      y: sy,
      size: 7.5,
      font: fontBold,
      color: WHITE,
    });
  });

  // Service column 2 clickable area
  addLinkAnnotation(pdfDoc, page, [footCol2X, 40, footCol2X + 160, footerH - 15], 'https://hazwoper-osha.com/online-courses');

  // ── Address & Home Icon ─────────────────────────────────────
  const addrX = 472;
  // House icon (yellow badge with vector triangle roof)
  drawCircle(page, addrX + 7, footerH - 18, 6.5, YELLOW);
  page.drawSvgPath(`M ${addrX + 3} ${footerH - 21} L ${addrX + 7} ${footerH - 14} L ${addrX + 11} ${footerH - 21} Z`, {
    color: BLACK,
  });

  page.drawText('11901 Santa Monica Blvd,', {
    x: addrX + 18,
    y: footerH - 22,
    size: 7.5,
    font: fontRegular,
    color: WHITE,
  });
  page.drawText('Suite # 414', {
    x: addrX + 18,
    y: footerH - 33,
    size: 7.5,
    font: fontRegular,
    color: WHITE,
  });
  page.drawText('Los Angeles, CA 90025', {
    x: addrX + 18,
    y: footerH - 44,
    size: 7.5,
    font: fontRegular,
    color: WHITE,
  });

  // Clickable link on address block
  addLinkAnnotation(pdfDoc, page, [addrX, footerH - 55, W - 10, footerH - 10], 'https://hazwoper-osha.com/contact-us');

  // ── Social Media Badges (LinkedIn, Facebook, YouTube, Instagram, Twitter/X, Pinterest) ─
  const socialY = 48;
  const socialR = 8.5;
  const socialStartX = 472;
  const socialGap = 22;

  // 1. LinkedIn
  const liX = socialStartX;
  drawCircle(page, liX, socialY, socialR, YELLOW);
  page.drawText('in', { x: liX - 4.5, y: socialY - 3, size: 8.5, font: fontBold, color: BLACK });
  addLinkAnnotation(pdfDoc, page, [liX - socialR, socialY - socialR, liX + socialR, socialY + socialR], 'https://www.linkedin.com/company/hazwoper-osha/');

  // 2. Facebook
  const fbX = socialStartX + socialGap;
  drawCircle(page, fbX, socialY, socialR, YELLOW);
  page.drawText('f', { x: fbX - 2.5, y: socialY - 3, size: 9.5, font: fontBold, color: BLACK });
  addLinkAnnotation(pdfDoc, page, [fbX - socialR, socialY - socialR, fbX + socialR, socialY + socialR], 'https://www.facebook.com/HazwoperOsha');

  // 3. YouTube (Bold 'Y' text icon)
  const ytX = socialStartX + socialGap * 2;
  drawCircle(page, ytX, socialY, socialR, YELLOW);
  page.drawText('Y', { x: ytX - 3.2, y: socialY - 3, size: 8.5, font: fontBold, color: BLACK });
  addLinkAnnotation(pdfDoc, page, [ytX - socialR, socialY - socialR, ytX + socialR, socialY + socialR], 'https://www.youtube.com/@hazwoper-osha');

  // 4. Instagram ('ig')
  const igX = socialStartX + socialGap * 3;
  drawCircle(page, igX, socialY, socialR, YELLOW);
  page.drawText('ig', { x: igX - 4.5, y: socialY - 3, size: 8.5, font: fontBold, color: BLACK });
  addLinkAnnotation(pdfDoc, page, [igX - socialR, socialY - socialR, igX + socialR, socialY + socialR], 'https://www.instagram.com/hazwoper_osha_training/');

  // 5. Twitter / X ('x')
  const twX = socialStartX + socialGap * 4;
  drawCircle(page, twX, socialY, socialR, YELLOW);
  page.drawText('X', { x: twX - 3.5, y: socialY - 3, size: 8.5, font: fontBold, color: BLACK });
  addLinkAnnotation(pdfDoc, page, [twX - socialR, socialY - socialR, twX + socialR, socialY + socialR], 'https://twitter.com/HazwoperOsha/');

  // 6. Pinterest ('p')
  const pinX = socialStartX + socialGap * 5;
  drawCircle(page, pinX, socialY, socialR, YELLOW);
  page.drawText('p', { x: pinX - 3, y: socialY - 3, size: 8.5, font: fontBold, color: BLACK });
  addLinkAnnotation(pdfDoc, page, [pinX - socialR, socialY - socialR, pinX + socialR, socialY + socialR], 'https://www.pinterest.com/HazwoperOsha/');

  // ── Bottom Yellow Polygon Bar with Tagline ──────────────────
  const taglineText = 'Train Today. Work Safely. Return Home.';
  const tagW = fontBoldItalic.widthOfTextAtSize(taglineText, 11);

  // Draw bottom yellow polygon bar
  page.drawSvgPath(`M 150 22 L 462 22 L 442 0 L 170 0 Z`, {
    color: YELLOW,
  });

  page.drawText(taglineText, {
    x: (W - tagW) / 2,
    y: 6,
    size: 11,
    font: fontBoldItalic,
    color: BLACK,
  });

  // Clickable link on bottom tagline bar
  addLinkAnnotation(pdfDoc, page, [150, 0, 462, 22], 'https://www.hazwoper-osha.com');

  // ── Save & Return Buffer ────────────────────────────────────
  const pdfBytes = await pdfDoc.save();
  return pdfBytes.buffer;
}

// ── Helper: Draw Section Heading with Left Pill Accent ────────────
function drawSectionHeading(page, title, x, y, fontBold) {
  // Yellow vertical pill accent bar
  page.drawRectangle({
    x: x,
    y: y - 2,
    width: 4,
    height: 14,
    color: YELLOW,
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
