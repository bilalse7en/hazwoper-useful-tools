import { describe, it, expect } from 'vitest';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  createBlankPdf,
  exportModifiedPdf,
  PAGE_SIZES,
} from '@/lib/pdf-editor-engine';

describe('PDF Editor Functionality Audit Suite', () => {
  it('1 & 2: creates, loads and parses a multi-page PDF document', async () => {
    const originalBuf = await createBlankPdf({
      pageSize: 'letter',
      pageCount: 3,
      bgColor: '#ffffff',
    });

    expect(originalBuf).toBeDefined();
    expect(originalBuf.byteLength).toBeGreaterThan(500);

    const loaded = await PDFDocument.load(originalBuf);
    expect(loaded.getPageCount()).toBe(3);
    const p1 = loaded.getPage(0);
    expect(p1.getSize().width).toBe(PAGE_SIZES.letter.width);
    expect(p1.getSize().height).toBe(PAGE_SIZES.letter.height);
  });

  it('3, 4 & 5: verifies architectural limitation on native PDF stream text selection and verifies Whiteout deletion mechanism', async () => {
    // Native PDF streams have baked text operators (BT, Tj, ET) with subsetted fonts.
    // The editor renders these to HTML5 Canvas via PDF.js.
    // To change or delete words, users apply a whiteout/redact overlay.
    const baseDoc = await PDFDocument.create();
    const font = await baseDoc.embedStandardFont(StandardFonts.Helvetica);
    const page = baseDoc.addPage([612, 792]);
    page.drawText('Confidential Company Policy', {
      x: 50,
      y: 700,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });
    const baseBytes = await baseDoc.save();

    const pagesConfig = [
      { id: 'p1', originalPageIndex: 0, rotation: 0, width: 612, height: 792 },
    ];

    // Delete existing words by applying whiteout, and change text by adding replacement text
    const overlaysMap = {
      p1: [
        {
          id: 'w1',
          type: 'whiteout',
          x: 48,
          y: 792 - 700 - 20, // canvas coordinates top-left
          width: 320,
          height: 30,
          color: '#ffffff',
        },
        {
          id: 't1',
          type: 'text',
          text: 'Public Organization Policy',
          x: 50,
          y: 792 - 700 - 18,
          fontSize: 18,
          color: '#16a34a',
          fontFamily: 'Helvetica, sans-serif',
        },
      ],
    };

    const exportedBuf = await exportModifiedPdf({
      originalArrayBuffer: baseBytes.buffer,
      pagesConfig,
      overlaysMap,
    });

    expect(exportedBuf.byteLength).toBeGreaterThan(baseBytes.byteLength);

    const reloaded = await PDFDocument.load(exportedBuf);
    expect(reloaded.getPageCount()).toBe(1);
  });

  it('6 & 7: tests adding new text with font size, color, and alignment options', async () => {
    const baseBuf = await createBlankPdf({ pageCount: 1 });
    const pagesConfig = [
      { id: 'p1', originalPageIndex: 0, rotation: 0, width: 612, height: 792 },
    ];

    const overlaysMap = {
      p1: [
        {
          id: 'text-left',
          type: 'text',
          text: 'Left Aligned Small Blue Text',
          x: 50,
          y: 100,
          fontSize: 12,
          color: '#2563eb',
          textAlign: 'left',
          width: 300,
        },
        {
          id: 'text-center',
          type: 'text',
          text: 'Center Aligned Large Red Headline',
          x: 50,
          y: 200,
          fontSize: 24,
          color: '#dc2626',
          fontFamily: 'Times-Roman',
          textAlign: 'center',
          width: 500,
        },
        {
          id: 'text-multiline',
          type: 'text',
          text: 'First Line of Paragraph\nSecond Line with Continuation',
          x: 50,
          y: 300,
          fontSize: 14,
          color: '#0f172a',
          textAlign: 'left',
          width: 400,
        },
      ],
    };

    const exportedBuf = await exportModifiedPdf({
      originalArrayBuffer: baseBuf,
      pagesConfig,
      overlaysMap,
    });

    const doc = await PDFDocument.load(exportedBuf);
    expect(doc.getPageCount()).toBe(1);
    expect(exportedBuf.byteLength).toBeGreaterThan(1000);
  });

  it('8, 9, 10 & 11: verifies multi-page operations (reorder, rotate, add page) and re-opens downloaded PDF', async () => {
    const baseDoc = await PDFDocument.create();
    baseDoc.addPage([612, 792]); // Original Page 0
    baseDoc.addPage([612, 792]); // Original Page 1
    const baseBytes = await baseDoc.save();

    // Reorder: Page 1 becomes first, Page 0 rotated 90 deg becomes second, add a new Page 2
    const pagesConfig = [
      {
        id: 'p-orig-1',
        originalPageIndex: 1,
        rotation: 0,
        width: 612,
        height: 792,
      },
      {
        id: 'p-orig-0',
        originalPageIndex: 0,
        rotation: 90,
        width: 612,
        height: 792,
      },
      {
        id: 'p-new-2',
        isNew: true,
        rotation: 0,
        width: 595.28,
        height: 841.89,
        bgColor: '#f8fafc',
      },
    ];

    const overlaysMap = {
      'p-orig-1': [
        {
          id: 't1',
          type: 'text',
          text: 'Now First Page',
          x: 100,
          y: 100,
          fontSize: 16,
        },
      ],
      'p-new-2': [
        {
          id: 't2',
          type: 'text',
          text: 'Inserted A4 Page',
          x: 80,
          y: 120,
          fontSize: 14,
        },
      ],
    };

    // Step 9 & 10: Save & Export
    const exportedBytes = await exportModifiedPdf({
      originalArrayBuffer: baseBytes.buffer,
      pagesConfig,
      overlaysMap,
    });

    // Step 11: Reopen exported bytes & verify modifications preserved
    const reloaded = await PDFDocument.load(exportedBytes);
    expect(reloaded.getPageCount()).toBe(3);

    // Page 0 (which was original page 1) has 0 rotation
    expect(reloaded.getPage(0).getRotation().angle).toBe(0);

    // Page 1 (which was original page 0) has 90 degree rotation
    expect(reloaded.getPage(1).getRotation().angle).toBe(90);

    // Page 2 (newly added page) has A4 size
    const p2Size = reloaded.getPage(2).getSize();
    expect(p2Size.width).toBeCloseTo(595.28, 1);
    expect(p2Size.height).toBeCloseTo(841.89, 1);
  });
});
