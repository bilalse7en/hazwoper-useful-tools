"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	FileText,
	Upload,
	Code,
	Eye,
	Copy,
	CheckCircle2,
	AlertCircle,
	Image as ImageIcon,
	Trash2,
	Save,
	FileDown,
	List,
	ListOrdered,
	Check,
	Sparkles,
	ArrowLeft,
	ArrowRight,
	Scissors,
	Download
} from "lucide-react";
import {
	processBlogFile,
	generateBlogCode,
	generateBlogFAQCode,
	splitBlogAndFAQ,
	consolidateLists,
	extractBlogFAQContent
} from "@/lib/docx-processor";
import { PreviewDrawer } from "@/components/preview-drawer";
import { RichTextEditor } from "@/components/rich-text-editor";

export function BlogGenerator() {
	const [file, setFile] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [progressText, setProgressText] = useState("");
	const [blogData, setBlogData] = useState(null);
	const [notification, setNotification] = useState(null);

	// Blog Form State
	const [featuredImage, setFeaturedImage] = useState("");
	const [altText, setAltText] = useState("");
	const [title, setTitle] = useState("");
	const [contentImages, setContentImages] = useState({}); // { 0: "url1", 1: "url2" }

	// Generated Code States
	const [blogCode, setBlogCode] = useState("");
	const [faqCode, setFaqCode] = useState("");

	// View State
	const [activeView, setActiveView] = useState("content"); // content, faq, editor
	const [editorContent, setEditorContent] = useState(""); // For Editor.js
	const fileInputRef = useRef(null);

	// Preview Drawer State
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewContent, setPreviewContent] = useState("");
	const [previewTitle, setPreviewTitle] = useState("");
	
	// Reset Confirmation State
	const [showResetConfirm, setShowResetConfirm] = useState(false);

	// Visual Review State
	const [rawStructure, setRawStructure] = useState([]);
	const [reviewIndex, setReviewIndex] = useState(0);
	const [showReview, setShowReview] = useState(false);
	const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
	
	// Enhanced Review Features
	const [undoStack, setUndoStack] = useState([]);
	const [redoStack, setRedoStack] = useState([]);
	const [bulkApproveCount, setBulkApproveCount] = useState(10);
	const [jumpToInput, setJumpToInput] = useState('');
	const [showFormatting, setShowFormatting] = useState(true);

	// Word File Analyzer State
	const [analyzerFile, setAnalyzerFile] = useState(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [analysisProgress, setAnalysisProgress] = useState(0);
	const [analysisResult, setAnalysisResult] = useState(null);
	const [fixedFileUrl, setFixedFileUrl] = useState(null);
	const analyzerInputRef = useRef(null);

	// --- BODY SCROLL LOCK ---
	useEffect(() => {
		if (showReview) {
			document.body.style.overflow = 'hidden';
			document.body.setAttribute('data-editor-open', 'true');
		} else {
			document.body.style.overflow = '';
			document.body.removeAttribute('data-editor-open');
		}
		return () => {
			document.body.style.overflow = '';
			document.body.removeAttribute('data-editor-open');
		};
	}, [showReview]);

	// --- NOTIFICATION HANDLER ---
	const showNotification = (message, type = "success") => {
		setNotification({ message, type });
		setTimeout(() => setNotification(null), 3000);
	};

	// --- MEMOIZED DATA FOR EDITOR ---
	// Moved to top level to comply with React "Rules of Hooks"
	const memoizedDefaultContent = useMemo(() => {
		if (editorContent) return editorContent;
		if (!rawStructure || rawStructure.length === 0) return '';
		
		return rawStructure.map(block => {
			const cleanContent = block.content || '';
			if (['H1', 'H2', 'H3'].includes(block.type)) {
				return `<${block.type.toLowerCase()}>${cleanContent}</${block.type.toLowerCase()}>`;
			} else if (block.type === 'P') {
				return `<p>${cleanContent}</p>`;
			} else if (block.type === 'UL') {
				const items = cleanContent.split('\n').filter(i => i.trim()).map(item => `<li>${item}</li>`).join('');
				return `<ul>${items}</ul>`;
			} else if (block.type === 'OL') {
				const items = cleanContent.split('\n').filter(i => i.trim()).map(item => `<li>${item}</li>`).join('');
				return `<ol>${items}</ol>`;
			} else if (block.type === 'table' || block.type === 'TABLE') {
				// Tables are already stored as HTML content
				return cleanContent;
			}
			return `<p>${cleanContent}</p>`;
		}).join('');
	}, [editorContent, rawStructure]);

	const handleFileChange = (e) => {
		if (e.target.files && e.target.files[0]) {
			setFile(e.target.files[0]);
			showNotification(`Selected: ${e.target.files[0].name}`, "info");
		}
	};

	const handleUpload = async () => {
		if (!file) return showNotification("Please select a file to upload.", "warning");

		setIsProcessing(true);
		setProgress(10);
		setProgressText("Reading DOCX file...");

		try {
			const interval = setInterval(() => {
				setProgress(p => Math.min(p + 10, 90));
			}, 200);

			const data = await processBlogFile(file);

			clearInterval(interval);
			setProgress(100);
			setProgressText("Blog content extracted successfully!");
			setBlogData(data);
			setTitle(data.blogData.title); // Auto-fill title
			
			// Auto-generate FAQ code if FAQs are found
			if (data.faqData && data.faqData.length > 0) {
				const faqCode = generateBlogFAQCode(data.faqData);
				setFaqCode(faqCode);
				showNotification(`Blog extracted! ${data.faqData.length} FAQs detected and generated.`, "success");
			} else {
				showNotification("Blog content extracted!", "success");
			}

			setTimeout(() => {
				setIsProcessing(false);
				setProgress(0);
				setProgressText("");
			}, 2000);

		} catch (error) {
			setIsProcessing(false);
			showNotification("Error extraction content: " + error.message, "error");
		}
	};

	const handleImageChange = (index, value) => {
		setContentImages(prev => ({
			...prev,
			[index]: value
		}));
	};

	const handleGenerateBlog = () => {
		if (!editorContent && !blogData) return showNotification("Please upload and process a file first.", "warning");

		// Use the current editor content (your edits) instead of regenerating
		let finalHTML = editorContent || '';
		
		// Remove all FAQ content from the blog
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = finalHTML;
		
		// Find and remove FAQ section (headings containing "FAQ" and their content)
		const allHeadings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
		allHeadings.forEach(heading => {
			const headingText = heading.textContent.toUpperCase();
			if (headingText.includes('FAQ') || headingText.includes('FREQUENTLY ASKED')) {
				// Remove this heading and all content until next heading or end
				let current = heading;
				const toRemove = [current];
				
				while (current.nextElementSibling) {
					const next = current.nextElementSibling;
					const nextTag = next.tagName?.toLowerCase();
					
					// Stop if we hit another section heading
					if (nextTag && nextTag.match(/^h[1-6]$/) && !next.textContent.toUpperCase().includes('FAQ')) {
						break;
					}
					
					toRemove.push(next);
					current = next;
				}
				
				// Remove all FAQ elements
				toRemove.forEach(el => el.remove());
			}
		});
		
		// Clean HTML: Replace &nbsp; with regular space
		finalHTML = tempDiv.innerHTML
			.replace(/&nbsp;/g, ' ')
			.replace(/&#160;/g, ' ');
		
		// Remove empty tags (p, div, span with no content)
		tempDiv.innerHTML = finalHTML;
		tempDiv.querySelectorAll('p, div, span').forEach(el => {
			if (!el.textContent.trim() && !el.querySelector('img, br')) {
				el.remove();
			}
		});
		
		// Add featured image after H1 and HR if provided
		if (featuredImage) {
			const h1 = tempDiv.querySelector('h1');
			if (h1) {
				let hr = h1.nextElementSibling;
				if (!hr || hr.tagName !== 'HR') {
					hr = document.createElement('hr');
					h1.after(hr);
				}
				
				// Check if image already exists
				const existingImg = hr.nextElementSibling;
				if (!existingImg || existingImg.tagName !== 'P' || !existingImg.querySelector('img')) {
					const imgP = document.createElement('p');
					const img = document.createElement('img');
					img.src = featuredImage;
					if (altText) img.alt = altText;
					img.className = 'w-100';
					imgP.appendChild(img);
					hr.after(imgP);
				}
			}
		}
		
		// Format tables based on headings (Top vs Left)
		tempDiv.querySelectorAll('table').forEach(table => {
			const rows = Array.from(table.querySelectorAll('tr'));
			if (rows.length === 0) return;

			// Apply requested base styles directly to table as requested
			table.className = "table table-container";
			table.setAttribute('style', 'display: block; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; -ms-overflow-style: -ms-autohiding-scrollbar; max-width: 850px; white-space: nowrap;');
			
			// 1. Top Heading Detection
			const thead = table.querySelector('thead');
			if (thead) {
				thead.querySelectorAll('tr').forEach(tr => tr.classList.add('bg-warning'));
			} else {
				const firstRow = rows[0];
				const firstRowCells = Array.from(firstRow.querySelectorAll('td, th'));
				const hasTh = firstRow.querySelector('th');
				const allBold = firstRowCells.length > 0 && firstRowCells.every(cell => cell.querySelector('b, strong') || cell.tagName === 'TH');
				if (hasTh || allBold) {
					firstRow.classList.add('bg-warning');
				}
			}

			// 2. Left Heading Detection
			rows.forEach(tr => {
				if (tr.classList.contains('bg-warning')) return;
				const cells = Array.from(tr.querySelectorAll('td, th'));
				if (cells.length > 0) {
					const firstCell = cells[0];
					const isLeftHeading = firstCell.tagName === 'TH' || firstCell.querySelector('b, strong');
					if (isLeftHeading) {
						firstCell.classList.add('bg-warning');
						firstCell.style.textAlign = 'left';
					}
				}
			});

			/* If table was inside a div.table-container, unwrap it to avoid double nesting */
			const parent = table.parentElement;
			if (parent && parent.tagName === 'DIV' && parent.classList.contains('table-container')) {
				parent.replaceWith(table);
			}
		});

		finalHTML = tempDiv.innerHTML;
		
		// Add full premium styling at the end
		const fancyLine = `
<div class="fancy-line"></div>
<style>
	.fancy-line { width: 60%; margin: 20px auto; border-top: 2px solid #116466; text-align: center; position: relative; }
	.fancy-line::after { content: "✦ ✦ ✦"; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: white; padding: 0 10px; color: red; }
	.table-container { display: block; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; -ms-overflow-style: -ms-autohiding-scrollbar; max-width: 850px; white-space: nowrap; margin: 2rem 0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
	table { width: 100%; border-collapse: collapse; background: white; margin-bottom: 1rem; }
	table tr p { margin-bottom: 0px !important; }
	th, td { padding: 12px 15px; border: 1px solid #e5e7eb; text-align: left; }
	.bg-warning { background-color: #ffcd05 !important; color: #1a1a1a !important; }
	.table-stripe tr:nth-child(even), .table-warning tr:nth-child(even) { background-color: #fffde6 !important; }
	thead th { background-color: #f3f4f6; font-weight: 700; }
</style>`;
		
		const code = finalHTML + fancyLine;
		setBlogCode(code);
		setActiveView("content");
		showNotification("Blog code generated (FAQ removed)!");
	};

	const handleGenerateFAQ = () => {
		if (!blogData) return showNotification("Please upload and process a file first.", "warning");
		
		// Check if FAQ data exists
		if (!blogData.faqData || blogData.faqData.length === 0) {
			return showNotification("No FAQs found in the document. Make sure your document has a section with 'FAQ' or 'FAQs' heading.", "warning");
		}
		
		const code = generateBlogFAQCode(blogData.faqData);
		setFaqCode(code);
		setActiveView("faq");
		showNotification(`FAQ code generated! ${blogData.faqData.length} FAQ${blogData.faqData.length > 1 ? 's' : ''} found.`, "success");
	};

	// Reset everything
	const handleReset = () => {
		setShowResetConfirm(true);
	};
	
	
	const confirmReset = () => {
		// Reset all state - complete clean slate
		setFile(null);
		setAnalyzerFile(null);
		setBlogData(null);
		setTitle("");
		setFeaturedImage("");
		setAltText("");
		setContentImages({});
		setBlogCode("");
		setFaqCode("");
		setEditorContent("");
		setShowReview(false);
		setAnalysisResult(null);
		setRawStructure([]);
		setReviewIndex(0);
		setActiveView("content");
		setProgress(0);
		setProgressText("");
		setIsProcessing(false);
		
		// Clear analyzer states
		setFixedFileUrl(null);
		setIsAnalyzing(false);
		setAnalysisProgress(0);
		
		// Clear undo/redo stacks
		setUndoStack([]);
		setRedoStack([]);
		
		// Close modal
		setShowResetConfirm(false);
		
		showNotification("Everything has been reset! Ready for a fresh start.", "success");
	};

	const downloadDemoFile = () => {
		const link = document.createElement('a');
		link.href = 'https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765354092/Blog_Sample_File.docx';
		link.download = 'Blog_Sample_File.docx';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const openPreview = (content, title) => {
		setPreviewContent(content);
		setPreviewTitle(title);
		setPreviewOpen(true);
	};

	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		showNotification("Copied to clipboard!");
	};

	const handleEditorSave = (html, imageData) => {
		// Consolidate consecutive lists first
		const consolidatedHtml = consolidateLists(html);
		
		// Just update the editor content - don't close or generate code
		setEditorContent(consolidatedHtml);
		
		// Store image data for later use
		if (imageData && imageData.featuredImageUrl) {
			setFeaturedImage(imageData.featuredImageUrl);
			setAltText(imageData.featuredImageAlt || '');
		}
		
		showNotification("Content saved! Use 'Generate Blog' button to create final HTML.", "success");
	};

	// Analyzer Functions
	const handleAnalyzerFileChange = (e) => {
		if (e.target.files && e.target.files[0]) {
			setAnalyzerFile(e.target.files[0]);
			setAnalysisResult(null);
			setFixedFileUrl(null);
			setShowReview(false);
			showNotification(`Selected: ${e.target.files[0].name}`, "info");
		}
	};

	const handleAnalyzeFile = async () => {
		if (!analyzerFile) return showNotification("Please select a file to analyze.", "warning");

		setIsAnalyzing(true);
		setAnalysisProgress(10);

		try {
			const formData = new FormData();
			formData.append('file', analyzerFile);
			formData.append('action', 'analyze');

			setAnalysisProgress(30);

			const response = await fetch('/api/analyze-docx', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Analysis failed');
			}

			// Clean the structure: Remove useless metadata and redundant segments
			const unwantedMetadata = [
				"meta description:",
				"meta-description:",
				"meta description",
				"meta title",
				"meta title:",
				"meta-title:",
				// "Link:",
				// "Link",
				"slug:",
				"slug",
				"category:",
				"category",
				"relevant category:",
				"relevant category",
				"seo description:",
				"seo description",
				"seo title:",
				"seo title",
				"keyword:",
				"keyword",
				"keywords:"
			];

			let rawBlocks = (data.rawStructure || []);
			let filteredBlocks = [];
			let encounteredFAQ = false;
			let isTruncating = false;

			for (let i = 0; i < rawBlocks.length; i++) {
				if (isTruncating) break;

				const block = { ...rawBlocks[i] };
				const originalContent = block.content || '';
				const lowerContent = originalContent.toLowerCase().trim();
				
				// Identify metadata blocks
				const isMetadata = unwantedMetadata.some(pattern => {
					const p = pattern.toLowerCase();
					return lowerContent.startsWith(p) || (lowerContent.includes(p) && lowerContent.length < p.length + 15);
				});
				
				// Identify FAQ start
				const isHeading = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(block.type);
				const hasFAQWords = lowerContent === 'faq' || 
								  lowerContent === 'faqs' || 
								  lowerContent === 'faqs:' || 
								  lowerContent === 'faq:' || 
								  lowerContent.includes('frequently asked') || 
								  lowerContent.includes('f.a.q');
				
				// TRUNCATION RULE: Stop if we hit metadata anywhere
				if (isMetadata) {
					isTruncating = true;
					break;
				}

				// Case 1: Detect FAQ Header
				if (!encounteredFAQ && ((isHeading && hasFAQWords) || (hasFAQWords && lowerContent.length < 50))) {
					encounteredFAQ = true;
					block.type = 'H1'; // Force FAQ header to H1
					block.content = originalContent.toUpperCase(); // Professional look
					filteredBlocks.push(block);
					continue;
				} 

				// Case 2: Skip metadata labels at the top (before FAQ)
				if (!encounteredFAQ && isMetadata) {
					// Skip label and its value
					if (i + 1 < rawBlocks.length) {
						const nextBlock = rawBlocks[i+1];
						const nextLower = (nextBlock.content || '').toLowerCase();
						if (!['H1', 'H2', 'H3'].includes(nextBlock.type) && !unwantedMetadata.some(p => nextLower.includes(p))) {
							i++; 
						}
					}
					continue;
				}

				// Case 3: Process content (Normal content OR FAQ content)
				if (encounteredFAQ) {
					// Detect numbered questions (e.g., "1. What is...")
					const questionMatch = originalContent.match(/^(\d+[\.\)]\s+)(.*)/);
					
					if (questionMatch) {
						block.content = `<strong>${originalContent}</strong>`;
						block._isQuestion = true;
					} else {
						// Format the Answer if it follows a question
						const prevBlock = filteredBlocks[filteredBlocks.length - 1];
						if (prevBlock && prevBlock._isQuestion && originalContent.trim().length > 0) {
							let answerText = originalContent.trim();
							// Normalize "Answer: " prefix
							if (!answerText.toLowerCase().startsWith('answer:')) {
								answerText = `Answer: ${answerText}`;
							} else {
								const valAfterColon = answerText.substring(answerText.indexOf(':') + 1).trim();
								answerText = `Answer: ${valAfterColon}`;
							}
							block.content = answerText;
						}
					}
				}

				// Keep the block
				filteredBlocks.push(block);
			}

			setAnalysisProgress(100);
			setAnalysisResult(data);
			setRawStructure(filteredBlocks);
			setReviewIndex(0);
			setShowReview(true);

		// Auto-extract and generate FAQ if present
		// Convert raw structure to HTML for FAQ extraction
		const htmlForFAQ = (data.rawStructure || []).map(block => {
			const content = block.content || '';
			if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(block.type)) {
				return `<${block.type.toLowerCase()}>${content}</${block.type.toLowerCase()}>`;
			} else if (block.type === 'P') {
				return `<p>${content}</p>`;
			} else if (block.type === 'UL' || block.type === 'OL') {
				const items = content.split('\n').filter(i => i.trim()).map(item => `<li>${item}</li>`).join('');
				return `<${block.type.toLowerCase()}>${items}</${block.type.toLowerCase()}>`;
			}
			return `<p>${content}</p>`;
		}).join('\n');
		
		const faqData = extractBlogFAQContent(htmlForFAQ);
		if (faqData && faqData.length > 0) {
			const faqCode = generateBlogFAQCode(faqData);
			setFaqCode(faqCode);
			showNotification("File analyzed! FAQ section detected and generated automatically.", "success");
		} else {
			showNotification("File analyzed! Now starting Step-by-Step review.", "success");
		}

			setTimeout(() => {
				setIsAnalyzing(false);
				setAnalysisProgress(0);
			}, 1000);

		} catch (error) {
			setIsAnalyzing(false);
			setAnalysisProgress(0);
			showNotification("Analysis error: " + error.message, "error");
		}
	};

	// FAQ extraction is now handled by extractBlogFAQContent from docx-processor.js
	// This function properly detects H1-H6 headings, numbered questions (1., Q1., Question 1),
	// and preserves HTML formatting in answers

	// Visual Review Handlers
	const updateBlockType = (index, newType) => {
		const newStructure = [...rawStructure];
		newStructure[index].type = newType;
		setRawStructure(newStructure);
	};

	const updateAllContent = (html) => {
		// Update the editor content
		setEditorContent(html);
		// Update blog code for Word generation
		setBlogCode(html);
		// Show success notification
		showNotification("Changes saved successfully!", "success");
	};


	const handleFinishReview = async () => {
		setIsGeneratingDoc(true);
		try {
			// Convert HTML from editor back to structure
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = editorContent;
			
			// Parse HTML into structure for Word generation
			const elements = tempDiv.querySelectorAll('h1, h2, h3, p, ul, ol, table, .table-container');
			const updatedStructure = [];
			
			elements.forEach((el) => {
				const tagName = el.tagName.toUpperCase();
				if (['H1', 'H2', 'H3', 'P'].includes(tagName)) {
					updatedStructure.push({
						type: tagName,
						// IMPORTANT: Use innerHTML to preserve bold, italic, links
						content: el.innerHTML.trim()
					});
				} else if (tagName === 'UL' || tagName === 'OL') {
					// For lists, we want the inner HTML of each LI
					const items = Array.from(el.querySelectorAll('li')).map(li => li.innerHTML.trim());
					updatedStructure.push({
						type: tagName,
						content: items.join('\n')
					});
				} else if (tagName === 'TABLE' || el.classList.contains('table-container')) {
					// Handle table elements
					const tableHtml = tagName === 'TABLE' ? el.outerHTML : (el.querySelector('table')?.outerHTML || el.innerHTML);
					updatedStructure.push({
						type: 'TABLE',
						content: tableHtml
					});
				}
			});

			const formData = new FormData();
			formData.append('action', 'generate');
			formData.append('structure', JSON.stringify(updatedStructure.length > 0 ? updatedStructure : rawStructure));

			const response = await fetch('/api/analyze-docx', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();
			if (!response.ok) throw new Error(data.error);

			// Download result
			const binaryString = atob(data.fileData);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
			const url = URL.createObjectURL(blob);

			setFixedFileUrl({ url, filename: data.fileName });
			showNotification("Perfect Word file generated!", "success");
			
			// Auto-load for blog processing
			const responseDoc = await fetch(url);
			const blobDoc = await responseDoc.blob();
			const fixedFile = new File([blobDoc], data.fileName, { 
				type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
			});
			setFile(fixedFile);
			setShowReview(false);
			
			// Auto-process the fixed file for blog generation
			showNotification("Processing fixed file for blog...", "info");
			
			try {
				const blogData = await processBlogFile(fixedFile);
				setBlogData(blogData);
				setTitle(blogData.blogData.title);
				
				// Auto-generate FAQ code if FAQs are found
				if (blogData.faqData && blogData.faqData.length > 0) {
					const faqCode = generateBlogFAQCode(blogData.faqData);
					setFaqCode(faqCode);
					showNotification(`Perfect file saved! ${blogData.faqData.length} FAQs detected and ready.`, "success");
				} else {
					showNotification("Perfect file saved and processed!", "success");
				}
			} catch (error) {
				showNotification("File saved but processing failed: " + error.message, "warning");
			}

		} catch (error) {
			showNotification("Generation error: " + error.message, "error");
		} finally {
			setIsGeneratingDoc(false);
		}
	};

	const handleDownloadFixed = () => {
		if (!fixedFileUrl) return;
		const link = document.createElement('a');
		link.href = fixedFileUrl.url;
		link.download = fixedFileUrl.filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		showNotification("Fixed file downloaded!");
	};

	return (
		<>
			{/* Reset Confirmation Modal - Full Page Overlay */}
			{showResetConfirm && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center" style={{zIndex: 9999}}>
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
						{/* Logo */}
						<div className="flex justify-center mb-4">
							<img 
								src="https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif" 
								alt="HAZWOPER useful tools" 
								className="h-16 w-auto"
								loading="lazy"
								width="64"
								height="64"
							/>
						</div>
						
						{/* Title */}
						<h3 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-white">
							Reset Everything?
						</h3>
						
						{/* Message */}
						<p className="text-center text-gray-600 dark:text-gray-300 mb-6">
							This will clear all content, settings, and generated code. This action cannot be undone.
						</p>
						
						{/* Buttons */}
						<div className="flex gap-3">
							<Button
								onClick={() => setShowResetConfirm(false)}
								variant="outline"
								className="flex-1"
							>
								Cancel
							</Button>
							<Button
								onClick={confirmReset}
								variant="destructive"
								className="flex-1 bg-red-600 hover:bg-red-700"
							>
								Reset Everything
							</Button>
						</div>
					</div>
				</div>
			)}
			
			<div className="space-y-6">
				{/* Grid Layout */}
				<div className="grid lg:grid-cols-2 gap-6">

				{/* LEFT COLUMN: Controls */}
				<div className="space-y-6">

					{/* Word File Analyzer & Fixer Card */}
					<Card className="card border-2 border-purple-500/30 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
						<CardHeader className="p-4 pb-2">
							<CardTitle className="flex items-center gap-2 text-lg font-bold">
								<Sparkles className="h-4 w-4 text-purple-500" />
								AI Word File Analyzer & Fixer
							</CardTitle>
							<p className="text-[10px] text-muted-foreground mt-1">
								Fix structure & SEO for Word files before processing.
							</p>
						</CardHeader>
						<CardContent className="card-body space-y-4">
							
							{!showReview ? (
								<>
									<div className="space-y-2">
										<div className="file-upload-area p-3 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg text-center cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/20 transition-colors"
											onClick={() => analyzerInputRef.current?.click()}>
											<Sparkles className="mx-auto h-5 w-5 text-purple-500 mb-1" />
											<p className="text-xs text-muted-foreground">Click to upload Word file for analysis</p>
										</div>
										<Input
											ref={analyzerInputRef}
											type="file"
											accept=".docx"
											onChange={handleAnalyzerFileChange}
											className="hidden"
										/>
										<div className="text-xs text-muted-foreground mt-1 text-center">
											{analyzerFile ? `Selected: ${analyzerFile.name}` : "No file selected"}
										</div>
									</div>

									{isAnalyzing && (
										<div className="pt-2">
											<Progress value={analysisProgress} className="progress-bar mb-2" />
											<p className="text-center text-sm text-muted-foreground">
												{analysisProgress < 30 ? "Reading file..." : "AI analyzing structure..."}
											</p>
										</div>
									)}
									<Button 
										onClick={handleAnalyzeFile} 
										disabled={!analyzerFile || isAnalyzing}
										size="sm"
										className="w-full btn bg-purple-600 hover:bg-purple-700 text-white h-9 text-xs"
									>
										<Sparkles className="mr-2 h-4 w-4" /> Analyze & Start &quot;1-by-1&quot; Review
									</Button>
								</>
							) : (
								<div className="flex flex-col items-center justify-center p-8 text-center bg-purple-500/5 rounded-xl border-2 border-dashed border-purple-200 animate-pulse">
									<Sparkles className="h-10 w-10 text-purple-400 mb-4" />
									<h4 className="text-sm font-bold text-purple-600">Review in Progress...</h4>
									<p className="text-xs text-muted-foreground mt-2">Finish the perfection window to continue.</p>
								</div>
							)}

							{fixedFileUrl && !showReview && (
								<div className="space-y-3 pt-4 border-t border-green-200 dark:border-green-800">
									<Button 
										onClick={handleDownloadFixed}
										className="w-full btn bg-green-600 hover:bg-green-700 text-white"
									>
										<Download className="mr-2 h-4 w-4" /> Download Perfect Word File
									</Button>
									<p className="text-xs text-center text-green-600 dark:text-green-400 font-medium">
										✅ File is 100% perfect and ready for processing!
									</p>
								</div>
							)}

						</CardContent>
					</Card>



					{/* Settings Card */}
					<Card className="card">
						<CardHeader className="p-4 pb-0">
							<CardTitle className="flex items-center gap-2 text-lg font-bold">
								<ImageIcon className="h-4 w-4 text-info" />
								Blog Settings
							</CardTitle>
						</CardHeader>
						<CardContent className="card-body space-y-4">


							{blogData && blogData.imageCount > 0 && (
								<div className="space-y-2 border-t pt-4">
									<Label className="text-xs font-semibold uppercase text-muted-foreground">
										Content Images ({blogData.imageCount} found)
									</Label>
									<ScrollArea className="h-[150px] pr-4">
										<div className="space-y-2">
											{Array.from({ length: blogData.imageCount }).map((_, i) => (
												<div key={i} className="flex flex-col gap-1">
													<Label className="text-xs">Image {i + 1} URL</Label>
													<Input
														placeholder={`URL for image placeholder ${i + 1}`}
														value={contentImages[i] || ""}
														onChange={(e) => handleImageChange(i, e.target.value)}
														className="form-control"
													/>
												</div>
											))}
										</div>
									</ScrollArea>
								</div>
							)}

							<div className="grid grid-cols-3 gap-2 pt-2">

								<Button onClick={handleGenerateBlog} className="btn bg-green-600 hover:bg-green-700 text-white">
									<Code className="mr-2 h-4 w-4" /> Generate Blog
								</Button>
								<Button onClick={handleGenerateFAQ} className="btn bg-blue-600 hover:bg-blue-700 text-white">
									<Code className="mr-2 h-4 w-4" /> Generate FAQ
								</Button>
							</div>
							{blogData && (
								<div className="mt-4 pt-4 border-t border-border">
								<Button 
									onClick={handleReset} 
									variant="destructive" 
									className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-2"
								>
									<span className="text-lg">🔄</span> Reset Everything
								</Button>
								</div>
							)}
						</CardContent>
					</Card>

				</div>

				{/* RIGHT COLUMN: Output */}
				<div className="space-y-6">
					<div className="card bg-card border rounded-lg shadow-sm min-h-[600px] flex flex-col overflow-hidden">

						{/* Selector Buttons */}
						{(blogCode || faqCode) ? (
							<div className="flex gap-2 p-2 border-b bg-muted/30">
								<button
									onClick={() => setActiveView("content")}
									className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'content'
										? 'bg-primary text-primary-foreground shadow-sm'
										: 'hover:bg-accent text-muted-foreground'
										}`}
								>
									Blog Content
								</button>
								<button
									onClick={() => setActiveView("faq")}
									className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'faq'
										? 'bg-primary text-primary-foreground shadow-sm'
										: 'hover:bg-accent text-muted-foreground'
										}`}
								>
									FAQ Code
								</button>
							</div>
						) : (
							<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10">
								<Code className="h-12 w-12 mb-4 opacity-20" />
								<h4 className="text-xl font-medium mb-2">No Code Generated Yet</h4>
								<p className="text-sm text-center max-w-xs">
									Upload a file and generate content to see the code here
								</p>
							</div>
						)}

						{/* Textarea Content */}
						{(blogCode || faqCode) && (
							<div className="flex-1 p-4 flex flex-col h-full overflow-hidden">
								<div className="flex items-center justify-between mb-2 mt-2">
									<h4 className="text-sm font-semibold flex items-center gap-2">
										<Code className="h-4 w-4" />
										{activeView === 'content' ? "Blog HTML Code" : "FAQ HTML Code"}
									</h4>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											className="preview-icon-btn"
											onClick={() => {
												const content = activeView === 'content' ? blogCode : faqCode;
												const title = activeView === 'content' ? 'Blog Post' : 'FAQ';
												openPreview(content, title);
											}}
										>
											<Eye className="h-3 w-3 mr-1" /> Preview
										</Button>
										<Button
											size="sm"
											className="copy-btn"
											onClick={() => {
												const content = activeView === 'content' ? blogCode : faqCode;
												copyToClipboard(content);
											}}
										>
											<Copy className="h-3 w-3 mr-1" /> Copy Code
										</Button>
									</div>
								</div>

								<textarea
									className="flex-1 w-full bg-muted/50 border rounded-md p-4 font-mono text-xs resize-none focus:outline-ring code-editor"
									value={activeView === 'content' ? blogCode : faqCode}
									readOnly
									placeholder="Code will appear here..."
								/>
							</div>
						)}
					</div>
				</div>
			</div>

			<PreviewDrawer
				open={previewOpen}
				onOpenChange={setPreviewOpen}
				title={previewTitle}
				content={previewContent}
				data={activeView === 'faq' ? blogData?.faqData : null}
			/>

			{notification && (
				<div className={`notification fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${notification.type === 'error'
					? 'bg-destructive text-destructive-foreground'
					: notification.type === 'warning'
						? 'bg-warning text-warning-foreground'
						: 'text-foreground'
					}`}>
					{notification.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
					{notification.message}
				</div>
			)}

			{showReview && (
				/* FULL SCREEN EDITOR FOR ALL 121 SECTIONS */
				<div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in duration-200">
					{/* Compact Header */}
					<div className="p-2 px-4 border-b flex items-center justify-between bg-white dark:bg-slate-900 shadow-sm" style={{ background: 'var(--card)', opacity: 1 }}>
						<div className="flex items-center gap-2">
							<Sparkles className="h-5 w-5 text-purple-500" />
							<div className="flex items-baseline gap-2">
								<h2 className="text-lg font-bold text-purple-600">AI Analyzer</h2>
								<p className="text-[10px] text-muted-foreground opacity-70 border-l pl-2 border-purple-200">
									Editing {rawStructure.length} blocks • Format & Fix
								</p>
							</div>
						</div>
						<div className="flex gap-2">
							<Button 
								variant="outline" 
								size="sm"
								onClick={() => setShowReview(false)}
								className="h-8 border-red-200 hover:bg-red-50 text-red-600 text-xs"
							>
								Cancel
							</Button>
							<Button
								onClick={handleFinishReview}
								disabled={isGeneratingDoc}
								size="sm"
								className="h-8 bg-green-600 hover:bg-green-700 text-white font-bold px-4 text-xs"
							>
								{isGeneratingDoc ? (
									<>
										<Sparkles className="animate-spin mr-1 h-3 w-3" />
										Saving...
									</>
								) : (
									<>
										<Check className="mr-1 h-3 w-3" />
										Generate Word
									</>
								)}
							</Button>
						</div>
					</div>

					{/* Full Screen Editor */}
					<div className="flex-1 overflow-y-auto">
						<RichTextEditor 
							content={memoizedDefaultContent}
							onSave={handleEditorSave}
							title="Full Document - All Sections"
						/>
					</div>
					</div>
				)}
			</div>
		</>
	);
}
