"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
	Save, Eye, Download, Undo, Redo, Bold, Italic, Underline, Link, 
	List, ListOrdered, Image as ImageIcon, ChevronDown, X, Table, 
	LayoutGrid, Columns, Palette, AlignLeft, AlignCenter, AlignRight, 
	AlignJustify, ArrowUp, ArrowDown, MoveVertical, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
	const [showImageTools, setShowImageTools] = useState(false);
	const [featuredImageUrl, setFeaturedImageUrl] = useState('');
	const [featuredImageAlt, setFeaturedImageAlt] = useState('');
	const [currentHeading, setCurrentHeading] = useState('p'); 
	const [activeTable, setActiveTable] = useState(null);
	const [showTableOptions, setShowTableOptions] = useState(false);
	const [showColorPalette, setShowColorPalette] = useState(false);

	const colors = [
		'#000000', '#ffffff', '#212529', '#f8f9fa', 
		'#0d6efd', '#6610f2', '#6f42c1', '#d63384', 
		'#dc3545', '#fd7e14', '#ffc107', '#198754', 
		'#20c997', '#0dcaf0', '#adb5bd', '#dee2e6'
	];

	// Initialize editor with content
	useEffect(() => {
		if (editorRef.current && content) {
			// Only set content if it's different from current content
			if (editorRef.current.innerHTML !== content) {
				editorRef.current.innerHTML = content;
				// Initialize history with first state in next tick to avoid cascading renders
				setTimeout(() => {
					if (editorRef.current) {
						setHistory([content]);
						setHistoryIndex(0);
						setIsReady(true);
					}
				}, 0);
			} else {
				setTimeout(() => setIsReady(true), 0);
			}
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
	const handleTextColor = (color) => execCommand('foreColor', color);
	
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

		// Check for active table
		let node = selection.anchorNode;
		if (node && node.nodeType === 3) node = node.parentElement;
		const table = node ? node.closest('table') : null;
		setActiveTable(table);
		if (!table) setShowTableOptions(false);
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

	const handleInsertTable = () => {
		const rows = prompt('Number of rows:', '3') || 3;
		const cols = prompt('Number of columns:', '3') || 3;
		
		let tableHtml = '<table class="table table-bordered table-container" style="display: block; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; -ms-overflow-style: -ms-autohiding-scrollbar; max-width: 850px; white-space: nowrap;">';
		
		// Header row
		tableHtml += '<thead><tr class="bg-warning text-white">';
		for (let j = 0; j < cols; j++) {
			tableHtml += `<th>Header ${j + 1}</th>`;
		}
		tableHtml += '</tr></thead><tbody>';
		
		// Data rows
		for (let i = 0; i < rows; i++) {
			tableHtml += '<tr>';
			for (let j = 0; j < cols; j++) {
				tableHtml += `<td>Data ${i + 1}-${j + 1}</td>`;
			}
			tableHtml += '</tr>';
		}
		
		tableHtml += '</tbody></table><p><br></p>';
		
		// Insert at cursor
		execCommand('insertHTML', tableHtml);
	};

	const applyTableClass = (className) => {
		const selection = window.getSelection();
		if (!selection.rangeCount) return;
		
		let element = selection.anchorNode;
		if (element.nodeType === 3) element = element.parentElement;
		
		const table = element.closest('table');
		if (table) {
			if (className === 'table-stripe') {
				table.classList.toggle('table-stripe');
			} else if (className === 'table-warning') {
				table.classList.toggle('table-warning');
			}
			saveToHistory();
		} else {
			alert('Please click inside a table to apply this style.');
		}
	};

	const toggleTopHeader = () => {
		const selection = window.getSelection();
		if (!selection.rangeCount) return;
		let element = selection.anchorNode;
		if (element.nodeType === 3) element = element.parentElement;
		const table = element.closest('table');
		if (table) {
			const firstRow = table.querySelector('tr');
			if (firstRow) {
				firstRow.classList.toggle('bg-warning');
				firstRow.classList.toggle('text-white');
			}
			saveToHistory();
		}
	};

	const toggleLeftHeader = () => {
		const selection = window.getSelection();
		if (!selection.rangeCount) return;
		let element = selection.anchorNode;
		if (element.nodeType === 3) element = element.parentElement;
		const table = element.closest('table');
		if (table) {
			const rows = table.querySelectorAll('tr');
			rows.forEach(row => {
				const firstCell = row.querySelector('td, th');
				if (firstCell) {
					firstCell.classList.toggle('bg-warning');
				}
			});
			saveToHistory();
		}
	};

	const handleAlignment = (alignment) => {
		execCommand(`justify${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`);
	};

	const setTableCellAlignment = (axis, value) => {
		const selection = window.getSelection();
		if (!selection.rangeCount) return;
		let node = selection.anchorNode;
		if (node.nodeType === 3) node = node.parentElement;
		const cell = node.closest('td, th');
		if (cell) {
			if (axis === 'x') {
				cell.style.textAlign = value;
			} else {
				cell.style.verticalAlign = value;
			}
			saveToHistory();
		}
	};

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

		// Process Tables - add Bootstrap 'table' class and ensure container
		tempDiv.querySelectorAll('table').forEach(table => {
			table.classList.add('table');
			table.classList.add('table-container');
			if (!table.classList.contains('table-bordered')) {
				table.classList.add('table-bordered');
			}
			table.setAttribute('style', 'display: block; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; -ms-overflow-style: -ms-autohiding-scrollbar; max-width: 850px; white-space: nowrap;');
			
			// Unwrap if inside a div.table-container
			const parent = table.parentElement;
			if (parent && parent.className === 'table-container') {
				parent.replaceWith(table);
			}
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

		// Ensure tables have responsive wrapper if missing
		tempDiv.querySelectorAll('table').forEach(table => {
			if (!table.parentElement.classList.contains('table-container')) {
				const wrapper = document.createElement('div');
				wrapper.className = 'table-container';
				wrapper.setAttribute('style', 'display: block;width: 100%;overflow-x: auto;-webkit-overflow-scrolling: touch;-ms-overflow-style: -ms-autohiding-scrollbar;max-width: 850px;white-space: nowrap;');
				table.parentNode.insertBefore(wrapper, table);
				wrapper.appendChild(table);
			}
		});
		
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

					/* Table Styles */
					.table-container {
						margin: 2rem 0;
						border-radius: 8px;
						overflow: hidden;
						box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
					}
					table {
					  width: 100%;
					  border-collapse: collapse;
					  background: white;
					}
					table tr p { margin-bottom: 0px; }
					th, td {
					  padding: 12px 15px;
					  border: 1px solid #e5e7eb;
					  text-align: left;
					}
					.bg-warning {
					  background-color: #ffcd05 !important;
					  color: #1a1a1a !important;
					}
					.table-stripe tr:nth-child(even) {
					  background-color: #fff9e6; /* Light Yellow Stripe */
					}
					.table-warning tr:nth-child(even) {
					  background-color: #fffde6; /* Very light yellow stripe */
					}
					thead th {
					  background-color: #f3f4f6;
					  font-weight: 700;
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
		<div className="bg-white dark:bg-slate-950 flex flex-col relative h-full" ref={toolbarRootRef}>
			{/* Fixed Toolbar at Top */}
			<div 
				className="fixed left-0 right-0 z-[200] flex items-center justify-between gap-1 p-2 border-b bg-white/95 dark:bg-slate-900/95 shadow-md backdrop-blur-md px-4 py-1.5"
			>
					<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="sm"
						onClick={handleUndo}
						disabled={!isReady || historyIndex <= 0}
						className="h-7 w-7 p-0"
						title="Undo"
					>
						<Undo className="h-3 w-3" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleRedo}
						disabled={!isReady || historyIndex >= history.length - 1}
						className="h-7 w-7 p-0"
						title="Redo"
					>
						<Redo className="h-3 w-3" />
					</Button>
					<div className="w-px h-6 bg-border mx-1" />
					<Button
						variant="outline"
						size="sm"
						onClick={handleBold}
						disabled={!isReady}
						className="h-7 w-7 p-0 font-bold"
						title="Bold (Ctrl+B)"
					>
						<Bold className="h-3 w-3" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleItalic}
						disabled={!isReady}
						className="h-7 w-7 p-0 italic"
						title="Italic (Ctrl+I)"
					>
						<Italic className="h-3 w-3" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleUnderline}
						disabled={!isReady}
						className="h-7 w-7 p-0 underline"
						title="Underline (Ctrl+U)"
					>
						<Underline className="h-3 w-3" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleLink}
						disabled={!isReady}
						className="h-7 w-7 p-0"
						title="Insert Link"
					>
						<Link className="h-3 w-3" />
					</Button>
					<div className="w-px h-6 bg-border mx-1" />
					<Button
						variant="outline"
						size="sm"
						onClick={handleInsertUnorderedList}
						disabled={!isReady}
						className="h-7 w-7 p-0"
						title="Bullet List"
					>
						<List className="h-3 w-3" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleInsertOrderedList}
						disabled={!isReady}
						className="h-7 w-7 p-0"
						title="Numbered List"
					>
						<ListOrdered className="h-3 w-3" />
					</Button>
					<div className="w-px h-6 bg-border mx-1" />
					
					{/* Professional Color Palette */}
					<div className="relative">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowColorPalette(!showColorPalette)}
							disabled={!isReady}
							className="h-7 w-7 p-0 flex flex-col items-center justify-center"
							title="Text Color"
						>
							<Palette className="h-3.5 w-3.5" />
							<div className="w-full h-1 mt-0.5 bg-black rounded-full" />
						</Button>
						
						<AnimatePresence>
							{showColorPalette && (
								<motion.div 
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 10 }}
									className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-900 border rounded-lg shadow-xl p-3 z-[300] w-48"
								>
									<div className="grid grid-cols-6 gap-2">
										{colors.map((color) => (
											<button
												key={color}
												onClick={() => {
													handleTextColor(color);
													setShowColorPalette(false);
												}}
												className="w-5 h-5 rounded-sm border border-black/10 transition-transform hover:scale-110 shadow-sm"
												style={{ backgroundColor: color }}
												title={color}
											/>
										))}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<div className="w-px h-6 bg-border mx-1" />

					{/* Alignment Tools */}
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleAlignment('left')}
						className="h-7 w-7 p-0"
						title="Align Left"
					>
						<AlignLeft className="h-3 w-3" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleAlignment('center')}
						className="h-7 w-7 p-0"
						title="Align Center"
					>
						<AlignCenter className="h-3 w-3" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleAlignment('right')}
						className="h-7 w-7 p-0"
						title="Align Right"
					>
						<AlignRight className="h-3 w-3" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleAlignment('full')}
						className="h-7 w-7 p-0"
						title="Justify"
					>
						<AlignJustify className="h-3 w-3" />
					</Button>

					<div className="w-px h-6 bg-border mx-1" />

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
						className="h-7 ml-1 text-[11px] px-1 border rounded bg-transparent"
					>
						<option value="p">P</option>
						<option value="h1">H1</option>
						<option value="h2">H2</option>
						<option value="h3">H3</option>
						<option value="h4">H4</option>
						<option value="h5">H5</option>
						<option value="h6">H6</option>
					</select>
					<Button
						variant={showImageTools ? "secondary" : "ghost"}
						size="sm"
						onClick={() => setShowImageTools(!showImageTools)}
						className={`h-7 w-7 p-0 ml-1 ${showImageTools ? 'bg-purple-500/10 text-purple-600' : ''}`}
						title="Image Settings"
					>
						<ImageIcon className="h-3.5 w-3.5" />
					</Button>
					
					{/* Refined Table Logic */}
					<div className="relative flex items-center gap-1 ml-1 pl-1 border-l">
						<Button
							variant={activeTable ? "default" : "outline"}
							size="sm"
							onClick={() => activeTable ? setShowTableOptions(!showTableOptions) : handleInsertTable()}
							disabled={!isReady}
							className={`h-7 w-7 p-0 ${activeTable ? 'bg-indigo-600 text-white' : ''}`}
							title={activeTable ? "Table Management" : "Insert Table"}
						>
							<Table className="h-3.5 w-3.5" />
						</Button>

						<AnimatePresence>
							{(showTableOptions || activeTable) && (
								<motion.div 
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -10 }}
									className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md ml-1"
								>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => applyTableClass('table-stripe')}
										className="h-6 px-2 text-[9px] font-bold hover:bg-yellow-100"
										title="Stripe"
									>
										STRIPE
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => applyTableClass('table-warning')}
										className="h-6 px-2 text-[9px] font-bold hover:bg-orange-100"
										title="Warning"
									>
										WARN
									</Button>
									<div className="w-px h-4 bg-slate-300 mx-0.5" />
									<Button
										variant="ghost"
										size="sm"
										onClick={toggleTopHeader}
										className="h-6 w-6 p-0 hover:bg-blue-100"
										title="Top Heading Warning"
									>
										<LayoutGrid className="h-3 w-3" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={toggleLeftHeader}
										className="h-6 w-6 p-0 hover:bg-green-100"
										title="Left Column Warning"
									>
										<Columns className="h-3 w-3" />
									</Button>
									<div className="w-px h-4 bg-slate-300 mx-0.5" />
									{/* Table Cell Alignment X */}
									<div className="flex bg-white/50 rounded p-0.5">
										<button onClick={() => setTableCellAlignment('x', 'left')} className="p-0.5 hover:bg-white"><AlignLeft className="h-3 w-3"/></button>
										<button onClick={() => setTableCellAlignment('x', 'center')} className="p-0.5 hover:bg-white"><AlignCenter className="h-3 w-3"/></button>
										<button onClick={() => setTableCellAlignment('x', 'right')} className="p-0.5 hover:bg-white"><AlignRight className="h-3 w-3"/></button>
									</div>
									{/* Table Cell Alignment Y */}
									<div className="flex bg-white/50 rounded p-0.5 ml-0.5">
										<button onClick={() => setTableCellAlignment('y', 'top')} className="p-0.5 hover:bg-white"><ArrowUp className="h-3 w-3"/></button>
										<button onClick={() => setTableCellAlignment('y', 'middle')} className="p-0.5 hover:bg-white"><MoveVertical className="h-3 w-3"/></button>
										<button onClick={() => setTableCellAlignment('y', 'bottom')} className="p-0.5 hover:bg-white"><ArrowDown className="h-3 w-3"/></button>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
				
				<AnimatePresence>
					{showImageTools && (
						<motion.div 
							initial={{ opacity: 0, x: 10 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 10 }}
							className="flex items-center gap-1.5 bg-purple-500/5 dark:bg-purple-500/10 p-1 px-2 rounded-md border border-purple-100 dark:border-purple-900 ml-auto"
						>
							<div className="flex items-center gap-1">
								<ImageIcon className="h-3 w-3 text-purple-500" />
								<Input
									type="text"
									placeholder="Image URL"
									value={featuredImageUrl}
									onChange={(e) => setFeaturedImageUrl(e.target.value)}
									className="h-6 w-36 text-[10px] px-2 bg-white dark:bg-slate-900 border-purple-200"
								/>
							</div>
							<Input
								type="text"
								placeholder="Alt Text"
								value={featuredImageAlt}
								onChange={(e) => setFeaturedImageAlt(e.target.value)}
								className="h-6 w-24 text-[10px] px-2 bg-white dark:bg-slate-900 border-purple-200"
							/>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowImageTools(false)}
								className="h-5 w-5 p-0 hover:bg-purple-100 text-purple-600 ml-1"
							>
								<X className="h-3 w-3" />
							</Button>
						</motion.div>
					)}
				</AnimatePresence>
				
				<div className="flex items-center gap-1.5">
					<Button
						variant="outline"
						size="sm"
						onClick={handlePreview}
						disabled={!isReady}
						className="h-7 w-7 p-0"
						title="Preview"
					>
						<Eye className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleDownload}
						disabled={!isReady}
						className="h-7 w-7 p-0"
						title="Download HTML"
					>
						<Download className="h-3.5 w-3.5" />
					</Button>
					<Button
						size="sm"
						onClick={handleSave}
						disabled={!isReady}
						className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700 text-white"
						title="Save Changes"
					>
						<Save className="h-3.5 w-3.5" />
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
			className={`p-6 bg-white dark:bg-slate-950 relative flex-1 ${featuredImageUrl ? 'mt-24' : 'mt-11'}`}
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
				
				/* Text Color Specifics */
				[contenteditable] [style*="color: rgb(255, 255, 255)"],
				[contenteditable] [style*="color: #ffffff"],
				[contenteditable] [style*="color: white"] {
					text-shadow: 0 0 1px rgba(0,0,0,0.5); /* Make white text visible in editor */
				}

				/* Table editor styles */
				[contenteditable] .table-container {
					margin: 20px 0;
					max-width: 100%;
					overflow-x: auto;
				}
				[contenteditable] table {
					width: 100%;
					border-collapse: collapse;
					margin-bottom: 1rem;
				}
				[contenteditable] th, [contenteditable] td {
					border: 1px solid #ddd;
					padding: 8px;
					min-width: 50px;
				}
				[contenteditable] .bg-warning {
					background-color: #ffcd05 !important;
					color: black !important;
				}
				[contenteditable] .bg-warning.text-white {
					color: white !important;
				}
				[contenteditable] .table-stripe tr:nth-child(even) {
					background-color: #fff9e6 !important;
				}
				[contenteditable] .table-warning tr:nth-child(even) {
					background-color: #fffde6 !important;
				}
				[contenteditable] table tr p {
					margin-bottom: 0px !important;
				}
				[contenteditable] table th {
					font-weight: bold;
				}
				`}</style>
			</div>
		</div>
	);
}
