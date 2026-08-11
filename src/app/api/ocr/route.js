import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';

// Helper to resolve Tesseract node worker path in Next.js bundled environment
function getTesseractOptions() {
  try {
    const nodeWorkerPath = path.join(
      process.cwd(),
      'node_modules',
      'tesseract.js',
      'src',
      'worker-script',
      'node',
      'index.js'
    );
    if (fs.existsSync(nodeWorkerPath)) {
      return { workerPath: nodeWorkerPath };
    }
  } catch (e) {
    console.warn('[OCR-API] Custom workerPath check failed:', e.message);
  }
  return {};
}

// Timeout wrapper for fetch requests
async function fetchWithTimeout(url, options, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

export async function POST(req) {
  console.log('[OCR-API] ⚡ Starting OCR processing...');
  const startTime = Date.now();

  try {
    const { image, mode } = await req.json();

    if (!image) {
      console.error('[OCR-API] ❌ No image data provided');
      return NextResponse.json(
        { error: 'Image data required' },
        { status: 400 }
      );
    }

    // Convert base64 to Buffer
    const base64Parts = image.split('base64,');
    const base64Data = base64Parts.length > 1 ? base64Parts[1] : base64Parts[0];
    const buffer = Buffer.from(base64Data, 'base64');
    const sizeKB = (buffer.length / 1024).toFixed(2);

    console.log(`[OCR-API] 📊 Image size: ${sizeKB}KB (Mode: ${mode || 'ai'})`);

    let extractedText = '';
    let provider = '';
    const useStandardOnly = mode === 'standard';

    // Helper: Gemini Vision AI
    const runGemini = async () => {
      console.log('[OCR-API] 🤖 Running Google Gemini Vision API...');
      const geminiResponse = await fetchWithTimeout(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyBqSF2nR6W5-x_cqf_CsIwQkaTmHgcSgT8',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Extract all text verbatim from this image, screenshot, or document. Return ONLY the exact extracted text without commentary, conversational introduction, or markdown wrapping.',
                  },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
          }),
        },
        15000
      );

      if (geminiResponse.ok) {
        const data = await geminiResponse.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return { text: text.trim(), provider: 'Gemini Vision AI' };
        }
      }
      return null;
    };

    // Helper: Pollinations Vision AI
    const runPollinations = async () => {
      console.log('[OCR-API] 🚀 Running Pollinations AI Engine...');
      const pollResponse = await fetchWithTimeout(
        'https://text.pollinations.ai/openai',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'openai-large',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Extract all visible text from this image or screenshot accurately. Output only the extracted text.',
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${base64Data}`,
                    },
                  },
                ],
              },
            ],
          }),
        },
        15000
      );

      if (pollResponse.ok) {
        const pollText = await pollResponse.text();
        if (pollText && pollText.trim()) {
          return { text: pollText.trim(), provider: 'Pollinations AI Engine' };
        }
      }
      return null;
    };

    // Helper: OCR.space Engine
    const runOCRSpace = async () => {
      console.log('[OCR-API] 🔄 Running OCR.space Engine...');
      const formData = new FormData();
      formData.append('base64Image', `data:image/jpeg;base64,${base64Data}`);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('OCREngine', '2');
      formData.append('apikey', 'K87161642888957');

      const ocrResponse = await fetchWithTimeout(
        'https://api.ocr.space/parse/image',
        {
          method: 'POST',
          body: formData,
        },
        12000
      );

      if (ocrResponse.ok) {
        const ocrData = await ocrResponse.json();
        if (ocrData.ParsedResults?.[0]?.ParsedText) {
          const resText = ocrData.ParsedResults[0].ParsedText.trim();
          if (resText) {
            return { text: resText, provider: 'OCR.space Engine' };
          }
        }
      }
      return null;
    };

    // Helper: Local Server Tesseract Engine
    const runLocalTesseract = async () => {
      console.log('[OCR-API] 🔧 Running Local Tesseract Engine...');
      let worker = null;
      try {
        const tessOptions = getTesseractOptions();
        worker = await createWorker('eng', 1, tessOptions);
        const {
          data: { text },
        } = await worker.recognize(buffer);

        if (text && text.trim()) {
          return { text: text.trim(), provider: 'Standard Tesseract Engine' };
        }
      } catch (e) {
        console.warn('[OCR-API] ⚠️ Local Tesseract engine warning:', e.message);
      } finally {
        if (worker) {
          try {
            await worker.terminate();
          } catch (_) {}
        }
      }
      return null;
    };

    // EXECUTION FLOW
    if (useStandardOnly) {
      // Standard Mode Pipeline: Local Tesseract -> OCR.space -> Gemini AI (Failsafe)
      try {
        const res = await runLocalTesseract();
        if (res) {
          extractedText = res.text;
          provider = res.provider;
        }
      } catch (e) {
        console.warn('[OCR-API] Tesseract step failed:', e.message);
      }

      if (!extractedText) {
        try {
          const res = await runOCRSpace();
          if (res) {
            extractedText = res.text;
            provider = res.provider;
          }
        } catch (e) {
          console.warn('[OCR-API] OCR.space step failed:', e.message);
        }
      }

      if (!extractedText) {
        try {
          const res = await runGemini();
          if (res) {
            extractedText = res.text;
            provider = `${res.provider} (Standard Fallback)`;
          }
        } catch (e) {
          console.warn('[OCR-API] Gemini fallback failed:', e.message);
        }
      }
    } else {
      // AI Mode Pipeline: Gemini -> Pollinations -> OCR.space -> Local Tesseract
      try {
        const res = await runGemini();
        if (res) {
          extractedText = res.text;
          provider = res.provider;
        }
      } catch (e) {
        console.warn('[OCR-API] Gemini failed:', e.message);
      }

      if (!extractedText) {
        try {
          const res = await runPollinations();
          if (res) {
            extractedText = res.text;
            provider = res.provider;
          }
        } catch (e) {
          console.warn('[OCR-API] Pollinations failed:', e.message);
        }
      }

      if (!extractedText) {
        try {
          const res = await runOCRSpace();
          if (res) {
            extractedText = res.text;
            provider = res.provider;
          }
        } catch (e) {
          console.warn('[OCR-API] OCR.space failed:', e.message);
        }
      }

      if (!extractedText) {
        try {
          const res = await runLocalTesseract();
          if (res) {
            extractedText = res.text;
            provider = res.provider;
          }
        } catch (e) {
          console.warn('[OCR-API] Local Tesseract failed:', e.message);
        }
      }
    }

    // FINAL RESPONSE
    if (!extractedText) {
      console.error(
        `[OCR-API] ❌ ALL PROVIDERS FAILED (${Date.now() - startTime}ms)`
      );
      return NextResponse.json(
        {
          error: 'Unable to extract text from image.',
          details:
            'Please ensure the image contains clear, readable text and try again.',
        },
        { status: 400 }
      );
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[OCR-API] 🎉 SUCCESS with ${provider} in ${elapsed}ms - Extracted ${extractedText.length} characters`
    );

    return NextResponse.json({
      text: extractedText,
      provider: provider,
      processingTime: elapsed,
    });
  } catch (error) {
    console.error('[OCR-API] 💥 UNCAUGHT ERROR:', error);
    return NextResponse.json(
      {
        error: 'Server error during OCR processing',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

