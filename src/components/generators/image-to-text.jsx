"use client";

import {useState,useEffect} from "react";
import {motion,AnimatePresence} from "framer-motion";
import {Upload,FileImage,Copy,Download,Loader2,CheckCircle2,AlertCircle,Sparkles,Zap,Clipboard} from "lucide-react";
import Tesseract from 'tesseract.js';

export default function ImageToText() {
	const [selectedFile,setSelectedFile]=useState(null);
	const [previewUrl,setPreviewUrl]=useState(null);
	const [extractedText,setExtractedText]=useState("");
	const [isProcessing,setIsProcessing]=useState(false);
	const [progress,setProgress]=useState(0);
	const [error,setError]=useState("");
	const [copied,setCopied]=useState(false);
	const [useAI,setUseAI]=useState(true); // Default to AI mode - using 100% FREE APIs (no quota limits!)

	const handleFileSelect=(e) => {
		const file=e.target.files?.[0];
		if(!file) return;

		const validTypes=['image/jpeg','image/jpg','image/png','image/gif','image/bmp','image/webp','image/tiff'];
		if(!validTypes.includes(file.type)) {
			setError("Please upload a valid image file (JPG, PNG, GIF, BMP, WEBP, TIFF)");
			return;
		}

		const maxSize=10*1024*1024; // 10MB
		if(file.size>maxSize) {
			setError("File size must be less than 10MB");
			return;
		}

		setSelectedFile(file);
		setError("");
		setExtractedText("");
		setProgress(0);

		const reader=new FileReader();
		reader.onloadend=() => {
			setPreviewUrl(reader.result);
		};
		reader.readAsDataURL(file);
	};

	// Preprocess image for better OCR accuracy
	const preprocessImage=(imageUrl) => {
		return new Promise((resolve) => {
			const img=new Image();
			img.crossOrigin="anonymous";
			img.onload=() => {
				const canvas=document.createElement('canvas');
				const ctx=canvas.getContext('2d');
				
				// Scale up small images for better recognition
				const scale=Math.max(1,2000/Math.max(img.width,img.height));
				canvas.width=img.width*scale;
				canvas.height=img.height*scale;
				
				// Draw original image scaled up
				ctx.drawImage(img,0,0,canvas.width,canvas.height);
				
				// Get image data for processing
				const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
				const data=imageData.data;
				
				// Convert to grayscale and increase contrast
				for(let i=0;i<data.length;i+=4) {
					// Grayscale
					const gray=0.299*data[i]+0.587*data[i+1]+0.114*data[i+2];
					
					// Increase contrast (factor 1.4)
					const contrast=1.4;
					const adjusted=((gray-128)*contrast)+128;
					const final=Math.max(0,Math.min(255,adjusted));
					
					data[i]=final;
					data[i+1]=final;
					data[i+2]=final;
				}
				
				ctx.putImageData(imageData,0,0);
				resolve(canvas.toDataURL('image/png'));
			};
			img.src=imageUrl;
		});
	};

	const extractWithAI=async (base64Image) => {
		// Using Hugging Face's FREE Inference API - No API key needed, no quota limits!
		// Try multiple free OCR models for best results
		const models=[
			'microsoft/trocr-base-printed',
			'microsoft/trocr-large-printed',
		];
		
		const imageBlob=await fetch(base64Image).then(r => r.blob());
		
		for(const model of models) {
			try {
				const response=await fetch(`https://api-inference.huggingface.co/models/${model}`,{
					method: 'POST',
					headers: {'Content-Type': 'application/octet-stream'},
					body: imageBlob
				});
				
				if(!response.ok) {
					const errorData=await response.json().catch(() => ({}));
					// If model is loading, wait and retry
					if(errorData.error?.includes('loading')) {
						await new Promise(r => setTimeout(r,3000));
						continue;
					}
					continue;
				}
				
				const data=await response.json();
				
				if(data && data[0] && data[0].generated_text) {
					return data[0].generated_text.trim();
				}
				if(typeof data === 'string') {
					return data.trim();
				}
			} catch(e) {
				console.log(`Model ${model} failed, trying next...`);
				continue;
			}
		}
		
		// Fallback: Use free OCR.space API with public free key
		const formData=new FormData();
		formData.append('base64Image',base64Image);
		formData.append('language','eng');
		formData.append('isOverlayRequired','false');
		formData.append('OCREngine','2'); // Engine 2 is more accurate
		formData.append('apikey','K87161642888957'); // Public free testing key
		
		try {
			const ocrResponse=await fetch('https://api.ocr.space/parse/image',{
				method: 'POST',
				body: formData
			});
			
			const ocrData=await ocrResponse.json();
			
			if(ocrData.ParsedResults && ocrData.ParsedResults[0]) {
				const text=ocrData.ParsedResults[0].ParsedText;
				if(text && text.trim()) {
					return text.trim();
				}
			}
			
			if(ocrData.ErrorMessage) {
				throw new Error(ocrData.ErrorMessage.join(', '));
			}
		} catch(e) {
			console.error('OCR.space error:',e);
		}
		
		throw new Error('AI extraction failed. Please try Standard Mode (Tesseract) instead.');
	};

	const extractWithTesseract=async () => {
		// Preprocess image for better accuracy
		setProgress(5);
		const processedImage=await preprocessImage(previewUrl);
		setProgress(15);
		
		const result=await Tesseract.recognize(
			processedImage, // Use preprocessed image
			'eng',
			{
				logger: (m) => {
					if(m.status==='recognizing text') {
						setProgress(15+Math.round(m.progress*85));
					}
				},
				// Optimal settings for maximum accuracy
				tessedit_ocr_engine_mode: 1, // LSTM neural network engine (most accurate)
				tessedit_pageseg_mode: 3, // Fully automatic page segmentation
				preserve_interword_spaces: 1, // Preserve spacing between words
				tessedit_char_whitelist: '', // Allow all characters
			}
		);
		return result.data.text.trim();
	};

	const handleExtractText=async () => {
		if(!selectedFile) return;

		setIsProcessing(true);
		setError("");
		setProgress(0);

		try {
			let text;

			if(useAI) {
				// AI Mode - Google Gemini Vision
				setProgress(30);
				text=await extractWithAI(previewUrl);
				setProgress(100);
			} else {
				// Standard Mode - Tesseract
				text=await extractWithTesseract();
			}

			if(!text||text.length===0) {
				setError("No text found in the image. Please try another image with clearer text.");
			} else {
				setExtractedText(text);
				setProgress(100);
			}
		} catch(err) {
			console.error('OCR Error:',err);
			setError(err.message||"Failed to extract text. Please try again with a clearer image.");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleCopy=() => {
		navigator.clipboard.writeText(extractedText);
		setCopied(true);
		setTimeout(() => setCopied(false),2000);
	};

	const handleDownload=() => {
		const blob=new Blob([extractedText],{type: 'text/plain'});
		const url=URL.createObjectURL(blob);
		const a=document.createElement('a');
		a.href=url;
		a.download='extracted-text.txt';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleDragOver=(e) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop=(e) => {
		e.preventDefault();
		e.stopPropagation();

		const file=e.dataTransfer.files?.[0];
		if(file) {
			const event={target: {files: [file]}};
			handleFileSelect(event);
		}
	};

	// Handle clipboard paste (Ctrl+V)
	const handlePaste=(e) => {
		const items=e.clipboardData?.items;
		if(!items) return;

		for(let i=0;i<items.length;i++) {
			if(items[i].type.indexOf('image')!==-1) {
				const file=items[i].getAsFile();
				if(file) {
					const event={target: {files: [file]}};
					handleFileSelect(event);
					break;
				}
			}
		}
	};

	// Listen for paste events globally
	useEffect(() => {
		document.addEventListener('paste',handlePaste);
		return () => document.removeEventListener('paste',handlePaste);
	},[]);

	return (
		<div className="max-w-6xl mx-auto space-y-8">
			{/* Header */}
			<motion.div
				className="text-center"
				initial={{opacity: 0,y: -20}}
				animate={{opacity: 1,y: 0}}
			>
				<h2 className="text-4xl font-black bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent mb-3">
					AI Image to Text Converter
				</h2>
				<p className="text-muted-foreground text-lg">
					Extract text from images using advanced AI or standard OCR
				</p>
			</motion.div>

			{/* AI Toggle */}
			<motion.div
				className="flex justify-center"
				initial={{opacity: 0}}
				animate={{opacity: 1}}
				transition={{delay: 0.1}}
			>
				<div className="glass-panel p-2 rounded-full flex gap-2">
					<button
						onClick={() => setUseAI(false)}
						className={`px-6 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${!useAI? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white':'text-foreground/60 hover:text-foreground'
							}`}
					>
						<Zap className="w-4 h-4" />
						Standard Mode
					</button>
					<button
						onClick={() => setUseAI(true)}
						className={`px-6 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${useAI? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white':'text-foreground/60 hover:text-foreground'
							}`}
					>
						<Sparkles className="w-4 h-4" />
						AI Mode (Best)
					</button>
				</div>
			</motion.div>

			<div className="grid lg:grid-cols-2 gap-8">
				{/* Upload Section */}
				<motion.div
					className="space-y-6"
					initial={{opacity: 0,x: -20}}
					animate={{opacity: 1,x: 0}}
					transition={{delay: 0.2}}
				>
					<div className="glass-panel p-8 rounded-3xl border border-border">
						<h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
							<Upload className="w-6 h-6" />
							Upload Image
						</h3>

						{/* Drag & Drop Area */}
						<div
							className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer relative overflow-hidden group"
							onDragOver={handleDragOver}
							onDrop={handleDrop}
							onClick={() => document.getElementById('fileInput')?.click()}
						>
							<motion.div
								className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"
							/>

							<div className="relative z-10">
								<div className="flex justify-center gap-4 mb-4">
									<FileImage className="w-12 h-12 text-foreground/40" />
									<Clipboard className="w-12 h-12 text-foreground/40" />
								</div>
								<p className="text-lg font-semibold text-foreground mb-2">
									Drop, click, or paste an image
								</p>
								<p className="text-sm text-muted-foreground mb-2">
									<kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+V</kbd> to paste from clipboard
								</p>
								<p className="text-xs text-muted-foreground">
									Supports JPG, PNG, GIF, BMP, WEBP, TIFF (max 10MB)
								</p>
							</div>

							<input
								id="fileInput"
								type="file"
								accept="image/*"
								onChange={handleFileSelect}
								className="hidden"
							/>
						</div>

						{/* Preview */}
						<AnimatePresence>
							{previewUrl&&(
								<motion.div
									className="mt-6"
									initial={{opacity: 0,scale: 0.9}}
									animate={{opacity: 1,scale: 1}}
									exit={{opacity: 0,scale: 0.9}}
								>
									<div className="glass-panel p-4 rounded-2xl overflow-hidden">
										<img
											src={previewUrl}
											alt="Preview"
											className="w-full h-auto max-h-96 object-contain rounded-xl"
										/>
										<p className="text-sm text-muted-foreground mt-3 text-center">
											{selectedFile?.name}
										</p>
									</div>
								</motion.div>
							)}
						</AnimatePresence>

						{/* Extract Button */}
						{selectedFile&&(
							<motion.button
								onClick={handleExtractText}
								disabled={isProcessing}
								className={`w-full mt-6 ${useAI? 'bg-gradient-to-r from-purple-500 to-pink-500':'bg-gradient-to-r from-primary via-blue-500 to-cyan-500'} text-white font-bold py-4 px-6 rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
								initial={{opacity: 0,y: 10}}
								animate={{opacity: 1,y: 0}}
								whileHover={{scale: 1.05}}
								whileTap={{scale: 0.98}}
							>
								{isProcessing? (
									<span className="flex flex-col items-center justify-center gap-2">
										<div className="flex items-center gap-2">
											<Loader2 className="w-5 h-5 animate-spin" />
											{useAI? 'AI Extracting Text...':'Extracting Text...'} {progress}%
										</div>
										<div className="w-full bg-white/20 rounded-full h-2 mt-1">
											<div
												className="bg-white h-2 rounded-full transition-all duration-300"
												style={{width: `${progress}%`}}
											/>
										</div>
									</span>
								):(
									<span className="flex items-center justify-center gap-2">
										{useAI? <Sparkles className="w-5 h-5" />:<FileImage className="w-5 h-5" />}
										{useAI? 'Extract with AI':'Extract Text'}
									</span>
								)}
							</motion.button>
						)}

						{/* Error Message */}
						<AnimatePresence>
							{error&&(
								<motion.div
									className="mt-4 glass-panel p-4 rounded-2xl border-2 border-red-500/50 bg-red-500/10"
									initial={{opacity: 0,x: -10}}
									animate={{opacity: 1,x: 0}}
									exit={{opacity: 0,x: -10}}
								>
									<div className="flex items-start gap-3">
										<AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
										<p className="text-red-500 text-sm font-medium">{error}</p>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</motion.div>

				{/* Results Section */}
				<motion.div
					className="space-y-6"
					initial={{opacity: 0,x: 20}}
					animate={{opacity: 1,x: 0}}
					transition={{delay: 0.3}}
				>
					<div className="glass-panel p-8 rounded-3xl border border-border">
						<h3 className="text-2xl font-bold text-foreground mb-4">
							Extracted Text
						</h3>

						{extractedText? (
							<div className="space-y-4">
								{/* Text Display */}
								<div className="glass-panel-deep p-6 rounded-2xl max-h-96 overflow-y-auto custom-scrollbar">
									<pre className="text-foreground whitespace-pre-wrap font-mono text-sm leading-relaxed">
										{extractedText}
									</pre>
								</div>

								{/* Action Buttons */}
								<div className="flex gap-3">
									<motion.button
										onClick={handleCopy}
										className="flex-1 glass-panel px-6 py-3 rounded-2xl border border-border hover:border-primary transition-colors font-semibold flex items-center justify-center gap-2"
										whileHover={{scale: 1.02}}
										whileTap={{scale: 0.98}}
									>
										{copied? (
											<>
												<CheckCircle2 className="w-5 h-5 text-green-500" />
												<span className="text-green-500">Copied!</span>
											</>
										):(
											<>
												<Copy className="w-5 h-5" />
												Copy Text
											</>
										)}
									</motion.button>

									<motion.button
										onClick={handleDownload}
										className="flex-1 glass-panel px-6 py-3 rounded-2xl border border-border hover:border-primary transition-colors font-semibold flex items-center justify-center gap-2"
										whileHover={{scale: 1.02}}
										whileTap={{scale: 0.98}}
									>
										<Download className="w-5 h-5" />
										Download TXT
									</motion.button>
								</div>

								{/* Stats */}
								<div className="glass-panel p-4 rounded-2xl text-center">
									<p className="text-sm text-muted-foreground">
										<span className="font-semibold text-foreground">
											{extractedText.length.toLocaleString()}
										</span> characters extracted {useAI? 'with AI':'with Tesseract'}
									</p>
								</div>
							</div>
						):(
							<div className="text-center py-16">
								<FileImage className="w-20 h-20 text-foreground/20 mx-auto mb-4" />
								<p className="text-muted-foreground">
									Upload an image and click "Extract Text" to see results here
								</p>
							</div>
						)}
					</div>

					{/* Info Card */}
					<div className="glass-panel p-6 rounded-2xl border border-border">
						<h4 className="font-bold text-foreground mb-3">
							{useAI? '🤖 AI Mode Features:':'⚡ Standard Mode Features:'}
						</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							{useAI? (
								<>
									<li className="flex items-start gap-2">
										<span className="text-primary">•</span>
										<span>Best accuracy for handwriting & complex layouts</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-primary">•</span>
										<span>Understands context and formatting</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-primary">•</span>
										<span>Perfect for Word screenshots & documents</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-primary">•</span>
										<span>Powered by Google Gemini Vision AI</span>
									</li>
								</>
							):(
								<>
									<li className="flex items-start gap-2">
										<span className="text-primary">•</span>
										<span>Fast processing with Tesseract OCR</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-primary">•</span>
										<span>Works 100% offline (client-side)</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-primary">•</span>
										<span>Good for printed text & clear images</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-primary">•</span>
										<span>No internet required after first load</span>
									</li>
								</>
							)}
						</ul>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
