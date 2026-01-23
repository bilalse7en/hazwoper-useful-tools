"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Eye, Download, Undo, Redo, Bold, Italic, Underline, Link, List, ListOrdered, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RichTextEditor({ content, onSave, title = "Editor" }) {
	const editorRef = useRef(null);
	const [isReady, setIsReady] = useState(false);
	const [history, setHistory] = useState([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const initialContentRef = useRef(content);
	const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
	const [floatingToolbarPosition, setFloatingToolbarPosition] = useState({ top: 0, left: 0 });
	const toolbarRootRef = useRef(null);
	const saveTimeoutRef = useRef(null);
	
	// Blog settings state
	const [showBlogSettings, setShowBlogSettings] = useState(false);
	const [featuredImageUrl, setFeaturedImageUrl] = useState('');
	const [featuredImageAlt, setFeaturedImageAlt] = useState('');
	const [currentHeading, setCurrentHeading] = useState('p'); // Track current heading

	// Initialize editor with content
	useEffect(() => {
		if (editorRef.current && content) {
			// Only set content if it's different from current content
			if (editorRef.current.innerHTML !== content) {
				editorRef.current.innerHTML = content;
				// Initialize history with first state
				setHistory([content]);
				setHistoryIndex(0);
			}
			setIsReady(true);
		}
	}, [content]);

	// Save current state to history
	const saveToHistory = useCallback(() => {
		if (!editorRef.current) return;
		
		const currentContent = editorRef.current.innerHTML;
		setHistory(prev => {
			const newHistory = prev.slice(0, historyIndex + 1);
			// Don't save if content is identical to last state
			if (newHistory[newHistory.length - 1] !== currentContent) {
				newHistory.push(currentContent);
			}
			return newHistory.slice(-50); // Keep last 50 states
		});
		setHistoryIndex(prev => Math.min(prev + 1, 49));
	}, [historyIndex]);

	// Handle input changes
	const handleInput = useCallback(() => {
		// Proper debounce for history saving
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}
		
		saveTimeoutRef.current = setTimeout(() => {
			saveToHistory();
		}, 500);
	}, [saveToHistory]);

	const handleUndo = () => {
		if (historyIndex > 0 && editorRef.current) {
			const newIndex = historyIndex - 1;
			editorRef.current.innerHTML = history[newIndex];
			setHistoryIndex(newIndex);
		}
	};

	const handleRedo = () => {
		if (historyIndex < history.length - 1 && editorRef.current) {
			const newIndex = historyIndex + 1;
			editorRef.current.innerHTML = history[newIndex];
			setHistoryIndex(newIndex);
		}
	};

	// Format commands
	const execCommand = (command, value = null) => {
		document.execCommand(command, false, value);
		editorRef.current?.focus();
		saveToHistory();
	};

	const handleBold = () => execCommand('bold');
	const handleItalic = () => execCommand('italic');
	const handleUnderline = () => execCommand('underline');
	
	// Handle text selection to show floating toolbar
	const handleTextSelection = useCallback(() => {
		const selection = window.getSelection();
		if (selection && selection.toString().trim().length > 0) {
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();
			
			// Detect current heading - walk up the DOM tree
			let element = range.commonAncestorContainer;
			if (element.nodeType === 3) {
				// Text node, get parent element
				element = element.parentElement;
			}
			
			// Find the heading or paragraph element
			let foundHeading = 'p';
			while (element && element !== editorRef.current) {
				const tag = element.tagName?.toLowerCase();
				if (tag === 'p') {
					foundHeading = 'p';
					break;
				} else if (tag && tag.match(/^h[1-6]$/)) {
					foundHeading = tag;
					break;
				}
				element = element.parentElement;
			}
			setCurrentHeading(foundHeading);
			
			// Calculate center position for toolbar
			const toolbarWidth = 200; // Approximate width
			const toolbarHeight = 280; // Approximate height
			
			// Center horizontally on screen
			let left = window.innerWidth / 2 - toolbarWidth / 2;
			
			// Position vertically - prefer right side of selection
			let top = rect.top + window.scrollY;
			
			// Ensure toolbar doesn't go off screen
			if (top < 80) top = 80; // Don't go above fixed header
			if (top + toolbarHeight > window.innerHeight + window.scrollY) {
				top = window.innerHeight + window.scrollY - toolbarHeight - 20;
			}

			setFloatingToolbarPosition({ top, left });
			setShowFloatingToolbar(true);
		} else {
			setShowFloatingToolbar(false);
		}
	}, [setFloatingToolbarPosition, setShowFloatingToolbar]);

	// Hide floating toolbar when clicking elsewhere
	useEffect(() => {
		const handleGlobalClick = (e) => {
			if (editorRef.current && !editorRef.current.contains(e.target)) {
				// Small delay to allow button clicks in floating toolbar
				setTimeout(() => {
					const selection = window.getSelection();
					if (!selection || selection.toString().trim().length === 0) {
						setShowFloatingToolbar(false);
					}
				}, 100);
			}
		};
		document.addEventListener('mousedown', handleGlobalClick);
		return () => document.removeEventListener('mousedown', handleGlobalClick);
	}, [editorRef, setShowFloatingToolbar]);
	
	
	const handleLink = () => {
		const url = prompt('Enter URL:');
		if (url) {
			execCommand('createLink', url);
		}
	};

	const handleInsertUnorderedList = () => execCommand('insertUnorderedList');
	const handleInsertOrderedList = () => execCommand('insertOrderedList');

	// Convert HTML to have proper Bootstrap classes when saving
	const processHTMLForSave = (html) => {
		if (!html) return '';
		
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = html;
		
		// Process H1 tags - add text-center fs-1 class
		tempDiv.querySelectorAll('h1').forEach(h1 => {
			h1.className = 'text-center fs-1';
		});
		
		// Process H2 tags - add fs-2 class
		tempDiv.querySelectorAll('h2').forEach(h2 => {
			h2.className = 'fs-2';
		});
		
		// Process H3 tags - add fs-3 class
		tempDiv.querySelectorAll('h3').forEach(h3 => {
			h3.className = 'fs-3';
		});
		
		// Process H4 tags - add fs-4 class
		tempDiv.querySelectorAll('h4').forEach(h4 => {
			h4.className = 'fs-4';
		});
		
		// Process H5 tags - add fs-5 class
		tempDiv.querySelectorAll('h5').forEach(h5 => {
			h5.className = 'fs-5';
		});
		
		// Process H6 tags - add fs-6 class
		tempDiv.querySelectorAll('h6').forEach(h6 => {
			h6.className = 'fs-6';
		});
		
		// Remove <strong> and <b> tags from inside ALL headings (h1-h6)
		// Headings don't need bold tags - they are already bold by default
		tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
			// Find all strong and b tags inside this heading
			heading.querySelectorAll('strong, b').forEach(boldTag => {
				// Replace the bold tag with just its text content
				const textNode = document.createTextNode(boldTag.textContent);
				boldTag.parentNode.replaceChild(textNode, boldTag);
			});
		});
		
		// Convert <b> to <strong> for SEO
		tempDiv.querySelectorAll('b').forEach(b => {
			const strong = document.createElement('strong');
			strong.innerHTML = b.innerHTML;
			b.parentNode.replaceChild(strong, b);
		});
		
		// Convert <i> to <em> for SEO
		tempDiv.querySelectorAll('i').forEach(i => {
			const em = document.createElement('em');
			em.innerHTML = i.innerHTML;
			i.parentNode.replaceChild(em, i);
		});
		
		// Add <hr> after first H1 if not already present
		const firstH1 = tempDiv.querySelector('h1');
		if (firstH1 && firstH1.nextElementSibling?.tagName !== 'HR') {
			const hr = document.createElement('hr');
			firstH1.after(hr);
		}
		
		let finalHTML = tempDiv.innerHTML;
		
		// Don't add fancy line here - it will be added when generating blog code
		// This prevents duplicate fancy lines on multiple saves
		
		return finalHTML;
	};
	
	// Save editor content and pass to parent component
	const handleSave = () => {
		if (editorRef.current) {
			const rawHTML = editorRef.current.innerHTML;
			const processedHTML = processHTMLForSave(rawHTML);
			
			// Just save the content and image data - no fancy line, no duplicates
			if (onSave) {
				onSave(processedHTML, {
					featuredImageUrl: featuredImageUrl,
					featuredImageAlt: featuredImageAlt
				});
			}
			
			// Show confirmation
			const notification = document.createElement('div');
			notification.textContent = '✓ Saved';
			notification.style.cssText = 'position:fixed;top:80px;right:20px;background:#10b981;color:white;padding:8px 16px;border-radius:6px;z-index:9999;font-size:14px;';
			document.body.appendChild(notification);
			setTimeout(() => notification.remove(), 2000);
		}
	};

	const handlePreview = () => {
		if (editorRef.current) {
			const rawHTML = editorRef.current.innerHTML;
			const processedHTML = processHTMLForSave(rawHTML);
			
			// Open preview in new window
			const previewWindow = window.open('', '_blank');
			previewWindow.document.write(`
				<!DOCTYPE html>
				<html>
				<head>
					<title>${title} - Preview</title>
					<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
					<style>
						@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
						
						* { box-sizing: border-box; }
						
						body { 
							font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
							max-width: 900px;
							margin: 0 auto;
							padding: 80px 30px;
							line-height: 1.8;
							color: #1f2937;
							background: linear-gradient(135deg, #faf5ff 0%, #f0f9ff 100%);
							font-size: 18px;
						}
						
						/* Bold */
						strong, b { 
							font-weight: 800;
							color: #111827;
							letter-spacing: -0.01em;
						}
						
						/* Italic */
						em, i {
							font-style: italic;
							color: #4b5563;
						}
						
						/* Underline */
					u {
						text-decoration: underline;
						text-decoration-color: #06b6d4;
						text-decoration-thickness: 2px;
						text-underline-offset: 3px;
					}
					
					/* Default margins */
					h1, h2, h3, h4, h5, h6 {
						margin-top: 1.5rem;
						margin-bottom: 1rem;
					}
					
					p {
						margin-top: 1rem;
						margin-bottom: 1rem;
					}
					
					ul, ol {
						margin-top: 1rem;
						margin-bottom: 1rem;
						padding-left: 2rem;
					}
					
					li {
						margin-bottom: 0.5rem;
					}
					
					/* Links */
					a { 
						color: #8b5cf6;
						text-decoration: none;
						border-bottom: 2px solid rgba(139, 92, 246, 0.35);
						transition: all 0.25s ease;
						font-weight: 600;
						padding: 0 2px;
					}
					
					a:hover { 
						color: #7c3aed;
						border-bottom-color: #7c3aed;
						background: rgba(139, 92, 246, 0.08);
						border-radius: 4px;
						padding: 2px 6px;
					}
					</style>
				</head>
				<body>
					${processedHTML}
				</body>
				</html>
			`);
			previewWindow.document.close();
		}
	};

	const handleDownload = () => {
		if (editorRef.current) {
			const rawHTML = editorRef.current.innerHTML;
			const processedHTML = processHTMLForSave(rawHTML);
			
			const blob = new Blob([processedHTML], { type: 'text/html' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.html`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	};

	return (
		<div className="bg-background flex flex-col relative h-full" ref={toolbarRootRef}>
			{/* Fixed Toolbar at Top */}
			<div 
				className="fixed left-0 right-0 z-[200] flex items-center justify-between gap-2 p-3 border-b bg-background/95 shadow-lg backdrop-blur-md px-10 py-3"
			>
					<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleUndo}
						disabled={!isReady || historyIndex <= 0}
						className="h-8"
						title="Undo"
					>
						<Undo className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleRedo}
						disabled={!isReady || historyIndex >= history.length - 1}
						className="h-8"
						title="Redo"
					>
						<Redo className="h-3.5 w-3.5" />
					</Button>
					<div className="w-px h-6 bg-border mx-1" />
					<Button
						variant="outline"
						size="sm"
						onClick={handleBold}
						disabled={!isReady}
						className="h-8 font-bold"
						title="Bold (Ctrl+B)"
					>
						<Bold className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleItalic}
						disabled={!isReady}
						className="h-8 italic"
						title="Italic (Ctrl+I)"
					>
						<Italic className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleUnderline}
						disabled={!isReady}
						className="h-8 underline"
						title="Underline (Ctrl+U)"
					>
						<Underline className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleLink}
						disabled={!isReady}
						className="h-8"
						title="Insert Link"
					>
						<Link className="h-3.5 w-3.5" />
					</Button>
					<div className="w-px h-6 bg-border mx-1" />
					<Button
						variant="outline"
						size="sm"
						onClick={handleInsertUnorderedList}
						disabled={!isReady}
						className="h-8"
						title="Bullet List"
					>
						<List className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleInsertOrderedList}
						disabled={!isReady}
						className="h-8"
						title="Numbered List"
					>
						<ListOrdered className="h-3.5 w-3.5" />
					</Button>
					{/* Heading selector */}
					<select
						value={currentHeading}
						onChange={(e) => {
							const tag = e.target.value;
							if (tag === 'p') {
								document.execCommand('formatBlock', false, 'P');
							} else {
								document.execCommand('formatBlock', false, tag.toUpperCase());
							}
							setCurrentHeading(tag);
						}}
						disabled={!isReady}
						className="h-8 ml-2"
					>
						<option value="p">Normal</option>
						<option value="h1">Heading 1</option>
						<option value="h2">Heading 2</option>
						<option value="h3">Heading 3</option>
						<option value="h4">Heading 4</option>
						<option value="h5">Heading 5</option>
						<option value="h6">Heading 6</option>
					</select>
				</div>
				
				{/* Blog Settings - Featured Image */}
				<div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4 ml-2">
					<div className="flex items-center gap-1">
						<ImageIcon className="h-4 w-4 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Featured Image URL (optional)"
							value={featuredImageUrl}
							onChange={(e) => setFeaturedImageUrl(e.target.value)}
							className="h-7 w-48 text-xs"
						/>
					</div>
					<Input
						type="text"
						placeholder="Alt Text (optional)"
						value={featuredImageAlt}
						onChange={(e) => setFeaturedImageAlt(e.target.value)}
						className="h-7 w-32 text-xs"
					/>
				</div>
				
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handlePreview}
						disabled={!isReady}
						className="h-8 w-8 p-0"
						title="Preview"
					>
						<Eye className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleDownload}
						disabled={!isReady}
						className="h-8 w-8 p-0"
						title="Download HTML"
					>
						<Download className="h-4 w-4" />
					</Button>
					<Button
						size="sm"
						onClick={handleSave}
						disabled={!isReady}
						className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white"
						title="Save Changes"
					>
						<Save className="h-4 w-4" />
					</Button>
				</div>
			</div>

		{/* Featured Image Preview - shows when URL is entered */}
		{featuredImageUrl && (
			<div className="fixed left-0 right-0 z-[190] bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-900 px-10 py-2 mt-14">
				<div className="flex items-center gap-4 max-w-xl mx-auto">
					<img 
						src={featuredImageUrl} 
						alt={featuredImageAlt || 'Featured image preview'} 
						className="h-16 w-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
						onError={(e) => { e.target.style.display = 'none'; }}
					/>
					<div className="text-xs text-muted-foreground">
						<p className="font-medium">Featured Image</p>
						{featuredImageAlt && <p className="opacity-70">Alt: {featuredImageAlt}</p>}
					</div>
				</div>
			</div>
		)}

		{/* Editor Container - with top padding for fixed toolbar */}
		<div 
			className={`p-6 bg-background relative flex-1 ${featuredImageUrl ? 'mt-32' : 'mt-14'}`}
			style={{ borderBottom: '1px solid #e5e7eb' }}
		>

				<div 
					ref={editorRef}
					contentEditable
					onInput={handleInput}
					onMouseUp={handleTextSelection}
					onKeyUp={handleTextSelection}
					className="prose prose-lg max-w-[80%] mx-auto dark:prose-invert outline-none"
					style={{
						minHeight: '500px',
						paddingBottom: '100px'
					}}
					suppressContentEditableWarning={true}
				/>
				
				{/* Floating Toolbar with ALL options */}
				{showFloatingToolbar && (
					<div 
					className="fixed z-[100] flex flex-col items-center gap-1 p-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl animate-in fade-in slide-in-from-left-2 duration-200"
					style={{ 
						top: `${floatingToolbarPosition.top}px`, 
						left: `163px`,
						transform: 'translateX(-163px)'
					}}
				>
						{/* Text Formatting */}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleBold}
							className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
							title="Bold"
						>
							<Bold className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleItalic}
							className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
							title="Italic"
						>
							<Italic className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleUnderline}
							className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
							title="Underline"
						>
							<Underline className="h-4 w-4" />
						</Button>
						
						<div className="h-px w-full bg-gray-300 dark:bg-gray-600 my-1" />
						
						{/* Heading Selector */}
						<select
							onChange={(e) => {
								const tag = e.target.value;
								if (tag === 'p') {
									document.execCommand('formatBlock', false, 'P');
								} else {
									document.execCommand('formatBlock', false, tag.toUpperCase());
								}
								saveToHistory();
							}}
							className="h-8 text-xs px-2 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
							defaultValue="p"
						>
							<option value="p">Normal</option>
							<option value="h1">H1</option>
							<option value="h2">H2</option>
							<option value="h3">H3</option>
							<option value="h4">H4</option>
							<option value="h5">H5</option>
							<option value="h6">H6</option>
						</select>
						
						<div className="h-px w-full bg-gray-300 dark:bg-gray-600 my-1" />
						
						{/* Lists */}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleInsertUnorderedList}
							className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
							title="Bullet List"
						>
							<List className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleInsertOrderedList}
							className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
							title="Numbered List"
						>
							<ListOrdered className="h-4 w-4" />
						</Button>
						
						<div className="h-px w-full bg-gray-300 dark:bg-gray-600 my-1" />
						
						{/* Link */}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleLink}
							className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
							title="Insert Link"
						>
							<Link className="h-4 w-4" />
						</Button>
					</div>
				)}
				<style jsx global>{`
					/* Heading styles in editor */
				[contenteditable] h1 { font-size: 2em; font-weight: bold; text-align: center; margin-top: 1.5rem; margin-bottom: 1rem; position: relative; }
				[contenteditable] h2 { font-size: 1.5em; font-weight: bold; margin-top: 1.5rem; margin-bottom: 1rem; position: relative; }
				[contenteditable] h3 { font-size: 1.17em; font-weight: bold; margin-top: 1.5rem; margin-bottom: 1rem; position: relative; }
				[contenteditable] h4 { font-size: 1em; font-weight: bold; margin-top: 1.5rem; margin-bottom: 1rem; position: relative; }
				[contenteditable] h5 { font-size: 0.83em; font-weight: bold; margin-top: 1.5rem; margin-bottom: 1rem; position: relative; }
				[contenteditable] h6 { font-size: 0.67em; font-weight: bold; margin-top: 1.5rem; margin-bottom: 1rem; position: relative; }
				
				/* Heading badges on hover */
				[contenteditable] h1:hover::after { content: "H1"; }
				[contenteditable] h2:hover::after { content: "H2"; }
				[contenteditable] h3:hover::after { content: "H3"; }
				[contenteditable] h4:hover::after { content: "H4"; }
				[contenteditable] h5:hover::after { content: "H5"; }
				[contenteditable] h6:hover::after { content: "H6"; }
				
				[contenteditable] h1:hover::after,
				[contenteditable] h2:hover::after,
				[contenteditable] h3:hover::after,
				[contenteditable] h4:hover::after,
				[contenteditable] h5:hover::after,
				[contenteditable] h6:hover::after {
					position: absolute;
					right: -40px;
					top: 0;
					background: #8b5cf6;
					color: white;
					padding: 2px 8px;
					border-radius: 4px;
					font-size: 11px;
					font-weight: 600;
					opacity: 0.8;
				}
				
				/* Paragraph margins */
				[contenteditable] p {
					margin-top: 1rem;
					margin-bottom: 1rem;
				}
				
				/* Ensure bold is visible */
				[contenteditable] strong,
				[contenteditable] b { 
					font-weight: 700 !important; 
					color: inherit;
				}
				
				/* Ensure italic is visible */
				[contenteditable] em,
				[contenteditable] i { 
					font-style: italic !important; 
				}
				
				/* Ensure underline is visible */
				[contenteditable] u { 
					text-decoration: underline !important; 
				}

				/* Support for nested lists (sublets) */
				[contenteditable] ul ul,
				[contenteditable] ul ol,
				[contenteditable] ol ul,
				[contenteditable] ol ol {
					margin-top: 0.25rem;
					margin-bottom: 0.25rem;
					margin-left: 1.5rem;
				}
				
				/* Links */
				[contenteditable] a { 
					color: #8b5cf6;
					text-decoration: underline;
					cursor: pointer;
				}
				
				/* Focus state */
				[contenteditable]:focus {
					outline: none;
				}
				
				/* Lists */
				[contenteditable] ul,
				[contenteditable] ol {
					padding-left: 2rem;
					margin-top: 1rem;
					margin-bottom: 1rem;
				}
				
				[contenteditable] li {
					margin-bottom: 0.5rem;
				}
				`}</style>
			</div>
		</div>
	);
}
