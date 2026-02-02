import {NextResponse} from 'next/server';
import {createWorker} from 'tesseract.js';

// Timeout wrapper for fetch requests
async function fetchWithTimeout(url, options, timeout = 10000) {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);
	
	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal
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
	console.log("[OCR-API] ⚡ Starting OCR processing...");
	const startTime = Date.now();
	
	try {
		const {image} = await req.json();
		
		if (!image) {
			console.error("[OCR-API] ❌ No image data provided");
			return NextResponse.json({error: "Image data required"}, {status: 400});
		}

		// Convert base64 to Buffer
		const base64Parts = image.split('base64,');
		const base64Data = base64Parts.length > 1 ? base64Parts[1] : base64Parts[0];
		const buffer = Buffer.from(base64Data, 'base64');
		const sizeKB = (buffer.length / 1024).toFixed(2);
		
		console.log(`[OCR-API] 📊 Image size: ${sizeKB}KB`);

		let extractedText = "";
		let provider = "";

		// ============================================
		// OPTION 1: Google Gemini Vision (FREE, FAST, BEST ACCURACY)
		// ============================================
		try {
			console.log("[OCR-API] 🤖 Trying Google Gemini Vision API...");
			
			const geminiResponse = await fetchWithTimeout(
				'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyBqSF2nR6W5-x_cqf_CsIwQkaTmHgcSgT8',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contents: [{
							parts: [
								{text: "Extract all visible text from this image. Return ONLY the extracted text, nothing else. Preserve formatting, line breaks, and special characters exactly as they appear."},
								{
									inline_data: {
										mime_type: "image/jpeg",
										data: base64Data
									}
								}
							]
						}]
					})
				},
				15000 // 15 second timeout
			);

			if (geminiResponse.ok) {
				const data = await geminiResponse.json();
				const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
				
				if (text && text.trim()) {
					extractedText = text.trim();
					provider = "Google Gemini Vision";
					console.log(`[OCR-API] ✅ Gemini SUCCESS (${Date.now() - startTime}ms)`);
				}
			} else {
				console.warn(`[OCR-API] ⚠️ Gemini failed with status ${geminiResponse.status}`);
			}
		} catch (e) {
			console.warn(`[OCR-API] ⚠️ Gemini error: ${e.message}`);
		}

		// ============================================
		// OPTION 2: OCR.space (FREE, RELIABLE FALLBACK)
		// ============================================
		if (!extractedText) {
			try {
				console.log("[OCR-API] 🔄 Trying OCR.space API...");
				
				const formData = new FormData();
				formData.append('base64Image', `data:image/jpeg;base64,${base64Data}`);
				formData.append('language', 'eng');
				formData.append('isOverlayRequired', 'false');
				formData.append('OCREngine', '2'); // Best engine
				formData.append('apikey', 'K87161642888957'); // Free tier key

				const ocrResponse = await fetchWithTimeout(
					'https://api.ocr.space/parse/image',
					{
						method: 'POST',
						body: formData
					},
					12000 // 12 second timeout
				);

				if (ocrResponse.ok) {
					const ocrData = await ocrResponse.json();
					if (ocrData.ParsedResults?.[0]?.ParsedText) {
						extractedText = ocrData.ParsedResults[0].ParsedText.trim();
						provider = "OCR.space";
						console.log(`[OCR-API] ✅ OCR.space SUCCESS (${Date.now() - startTime}ms)`);
					} else {
						console.warn("[OCR-API] ⚠️ OCR.space returned no text");
					}
				}
			} catch (e) {
				console.warn(`[OCR-API] ⚠️ OCR.space error: ${e.message}`);
			}
		}

		// ============================================
		// OPTION 3: Local Tesseract (LAST RESORT FAILSAFE)
		// ============================================
		if (!extractedText) {
			console.log("[OCR-API] 🔧 Using Local Tesseract failsafe...");
			let worker = null;
			try {
				worker = await createWorker('eng');
				const { data: { text } } = await worker.recognize(buffer);
				
				if (text && text.trim()) {
					extractedText = text.trim();
					provider = "Tesseract (Local)";
					console.log(`[OCR-API] ✅ Tesseract SUCCESS (${Date.now() - startTime}ms)`);
				}
			} catch (e) {
				console.error(`[OCR-API] ❌ Tesseract failed: ${e.message}`);
			} finally {
				if (worker) await worker.terminate();
			}
		}

		// ============================================
		// FINAL RESULT
		// ============================================
		if (!extractedText) {
			console.error(`[OCR-API] ❌ ALL PROVIDERS FAILED (${Date.now() - startTime}ms)`);
			return NextResponse.json({
				error: "All OCR services are temporarily unavailable.",
				details: "Please try Standard Mode (client-side Tesseract) or try again in a moment. If the issue persists, the image may not contain readable text."
			}, {status: 500});
		}

		const elapsed = Date.now() - startTime;
		console.log(`[OCR-API] 🎉 SUCCESS with ${provider} in ${elapsed}ms - Extracted ${extractedText.length} characters`);
		
		return NextResponse.json({
			text: extractedText,
			provider: provider,
			processingTime: elapsed
		});

	} catch (error) {
		console.error("[OCR-API] 💥 UNCAUGHT ERROR:", error);
		return NextResponse.json({
			error: "Server error during OCR processing",
			details: error.message
		}, {status: 500});
	}
}
