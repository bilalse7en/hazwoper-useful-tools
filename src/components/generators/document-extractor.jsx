"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
	Upload, 
	FileText, 
	Table, 
	FileCode, 
	Copy, 
	Download, 
	Loader2, 
	CheckCircle2, 
	AlertCircle, 
	Eye, 
	EyeOff,
	FileJson,
	Clipboard
} from "lucide-react";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";

export default function DocumentExtractor() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [extractedText, setExtractedText] = useState("");
	const [extractedHtml, setExtractedHtml] = useState("");
	const [error, setError] = useState("");
	const [copiedText, setCopiedText] = useState(false);
	const [copiedHtml, setCopiedHtml] = useState(false);
	const [showPreview, setShowPreview] = useState(true);
	const [fileType, setFileType] = useState(null); // 'word' | 'excel' | 'text'

	const handleFileSelect = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const extension = file.name.split('.').pop().toLowerCase();
		let type = null;

		if (['docx'].includes(extension)) type = 'word';
		else if (['xlsx', 'xls', 'csv'].includes(extension)) type = 'excel';
		else if (['txt', 'md', 'json', 'js', 'html', 'css'].includes(extension)) type = 'text';

		if (!type) {
			setError("Please upload a supported file type (.docx, .xlsx, .xls, .csv, .txt)");
			return;
		}

		setSelectedFile(file);
		setFileType(type);
		setError("");
		setExtractedText("");
		setExtractedHtml("");
	};

	const extractWord = async (file) => {
		const arrayBuffer = await file.arrayBuffer();
		const result = await mammoth.convertToHtml({ arrayBuffer });
		const textResult = await mammoth.extractRawText({ arrayBuffer });
		
		setExtractedHtml(result.value);
		setExtractedText(textResult.value);
	};

	const extractExcel = async (file) => {
		const arrayBuffer = await file.arrayBuffer();
		const workbook = XLSX.read(arrayBuffer, { type: 'array' });
		
		// Get first worksheet
		const firstSheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[firstSheetName];
		
		// Convert to HTML
		const html = XLSX.utils.sheet_to_html(worksheet);
		// Convert to Text (tab-separated)
		const text = XLSX.utils.sheet_to_txt(worksheet);
		
		setExtractedHtml(html);
		setExtractedText(text);
	};

	const extractText = async (file) => {
		const text = await file.text();
		setExtractedText(text);
		// For text files, HTML is just pre-formatted text or escaped paragraphs
		const html = `<pre style="white-space: pre-wrap; font-family: inherit;">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
		setExtractedHtml(html);
	};

	const handleExtract = async () => {
		if (!selectedFile) return;

		setIsProcessing(true);
		setError("");

		try {
			if (fileType === 'word') {
				await extractWord(selectedFile);
			} else if (fileType === 'excel') {
				await extractExcel(selectedFile);
			} else if (fileType === 'text') {
				await extractText(selectedFile);
			}
		} catch (err) {
			console.error("Extraction error:", err);
			setError("Failed to extract content. The file might be corrupted or unsupported.");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleCopy = (content, type) => {
		navigator.clipboard.writeText(content);
		if (type === 'text') {
			setCopiedText(true);
			setTimeout(() => setCopiedText(false), 2000);
		} else {
			setCopiedHtml(true);
			setTimeout(() => setCopiedHtml(false), 2000);
		}
	};

	const handleDownload = (content, ext) => {
		const blob = new Blob([content], { type: ext === 'html' ? 'text/html' : 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `extracted-content.${ext}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		const file = e.dataTransfer.files?.[0];
		if (file) {
			const event = { target: { files: [file] } };
			handleFileSelect(event);
		}
	};

	return (
		<div className="max-w-6xl mx-auto space-y-8">
			{/* Header */}
			<motion.div 
				className="text-center"
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
			>
				<h2 className="text-4xl font-black bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent mb-3">
					Document Content Extractor
				</h2>
				<p className="text-muted-foreground text-lg">
					Perfectly extract Plain Text or HTML from Word, Excel, and Text files
				</p>
			</motion.div>

			<div className="grid lg:grid-cols-2 gap-8">
				{/* Upload Section */}
				<motion.div 
					className="space-y-6"
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
				>
					<div className="glass-panel p-8 rounded-3xl border border-border">
						<h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
							<Upload className="w-6 h-6" />
							Upload Document
						</h3>

						<div 
							className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer relative overflow-hidden group"
							onDragOver={handleDragOver}
							onDrop={handleDrop}
							onClick={() => document.getElementById('fileInput')?.click()}
						>
							<motion.div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
							
							<div className="relative z-10">
								<div className="flex justify-center gap-4 mb-4">
									<FileText className="w-10 h-10 text-blue-500" />
									<Table className="w-10 h-10 text-green-500" />
									<FileCode className="w-10 h-10 text-purple-500" />
								</div>
								<p className="text-lg font-semibold text-foreground mb-2">
									Drop, click, or paste a document
								</p>
								<p className="text-xs text-muted-foreground">
									Supports DOCX, XLSX, XLS, CSV, TXT, MD (max 20MB)
								</p>
							</div>

							<input 
								id="fileInput"
								type="file"
								accept=".docx,.xlsx,.xls,.csv,.txt,.md,.json,.js,.html,.css"
								onChange={handleFileSelect}
								className="hidden"
							/>
						</div>

						{selectedFile && (
							<motion.div 
								className="mt-6 glass-panel p-4 rounded-2xl border border-primary/20 flex items-center justify-between"
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
							>
								<div className="flex items-center gap-3">
									{fileType === 'word' && <FileText className="w-8 h-8 text-blue-500" />}
									{fileType === 'excel' && <Table className="w-8 h-8 text-green-500" />}
									{fileType === 'text' && <FileCode className="w-8 h-8 text-purple-500" />}
									<div>
										<p className="text-sm font-bold truncate max-w-[200px]">{selectedFile.name}</p>
										<p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
									</div>
								</div>
								<button 
									onClick={handleExtract}
									disabled={isProcessing}
									className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
								>
									{isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "EXTRACT"}
								</button>
							</motion.div>
						)}

						{error && (
							<div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 flex items-center gap-3 text-red-500">
								<AlertCircle className="w-5 h-5 shrink-0" />
								<p className="text-sm font-medium">{error}</p>
							</div>
						)}
					</div>

					{/* Features Card */}
					<div className="glass-panel p-6 rounded-2xl border border-border">
						<h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
							<CheckCircle2 className="w-4 h-4 text-primary" />
							Extraction Capabilities
						</h4>
						<ul className="space-y-3 text-sm text-muted-foreground">
							<li className="flex items-start gap-3">
								<div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
								<span><strong>Word (.docx):</strong> Preserves headings, bold, italic, and lists.</span>
							</li>
							<li className="flex items-start gap-3">
								<div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
								<span><strong>Excel (.xlsx/xls):</strong> Converts sheets into clean HTML tables.</span>
							</li>
							<li className="flex items-start gap-3">
								<div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
								<span><strong>Text/Code:</strong> Perfect extraction of raw strings and formatting.</span>
							</li>
						</ul>
					</div>
				</motion.div>

				{/* Results Section */}
				<motion.div 
					className="space-y-6"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
				>
					<div className="glass-panel p-8 rounded-3xl border border-border h-full flex flex-col">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-foreground">Extracted Result</h3>
							{extractedText && (
								<button 
									onClick={() => setShowPreview(!showPreview)}
									className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors"
								>
									{showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
									{showPreview ? "HIDE PREVIEW" : "SHOW PREVIEW"}
								</button>
							)}
						</div>

						{extractedText ? (
							<div className="flex-1 flex flex-col space-y-4">
								{/* Preview Container */}
								<AnimatePresence mode="wait">
									{showPreview && (
										<motion.div 
											key="preview"
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: 'auto' }}
											exit={{ opacity: 0, height: 0 }}
											className="overflow-hidden"
										>
											<div className="mb-2 flex items-center gap-2">
												<Eye className="w-4 h-4 text-primary" />
												<span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Visual Preview</span>
											</div>
											<div className="glass-panel-deep p-6 rounded-2xl max-h-[300px] overflow-y-auto custom-scrollbar border border-primary/10">
												<div 
													className="prose prose-invert prose-sm max-w-none text-foreground"
													dangerouslySetInnerHTML={{ __html: extractedHtml }}
												/>
											</div>
										</motion.div>
									)}
								</AnimatePresence>

								{/* Copy Buttons */}
								<div className="grid grid-cols-2 gap-3 mt-auto">
									<div className="space-y-2">
										<button 
											onClick={() => handleCopy(extractedText, 'text')}
											className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border hover:border-primary transition-all font-bold text-sm bg-background/50"
										>
											{copiedText ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
											{copiedText ? "COPIED" : "PLAIN TEXT"}
										</button>
										<button 
											onClick={() => handleDownload(extractedText, 'txt')}
											className="w-full text-[10px] text-muted-foreground hover:text-foreground text-center"
										>
											Download .txt
										</button>
									</div>
									<div className="space-y-2">
										<button 
											onClick={() => handleCopy(extractedHtml, 'html')}
											className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border hover:border-primary transition-all font-bold text-sm bg-background/50"
										>
											{copiedHtml ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <FileCode className="w-4 h-4" />}
											{copiedHtml ? "COPIED" : "HTML CODE"}
										</button>
										<button 
											onClick={() => handleDownload(extractedHtml, 'html')}
											className="w-full text-[10px] text-muted-foreground hover:text-foreground text-center"
										>
											Download .html
										</button>
									</div>
								</div>
							</div>
						) : (
							<div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-40">
								<FileJson className="w-20 h-20 mb-4" />
								<p className="text-muted-foreground">
									Once extracted, you can preview and copy either <br />
									<strong>Plain Text</strong> or <strong>HTML Code</strong> here.
								</p>
							</div>
						)}
					</div>
				</motion.div>
			</div>
		</div>
	);
}
