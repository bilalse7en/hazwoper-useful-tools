import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

export async function POST(request) {
	try {
		const formData = await request.formData();
		const action = formData.get("action") || "analyze"; // Default to analyze
		
		// MODE: GENERATE DOCX FROM REVIEWED JSON
		if (action === "generate") {
			const structureJson = formData.get("structure");
			if (!structureJson) return NextResponse.json({ error: "No structure provided" }, { status: 400 });
			
			const structure = JSON.parse(structureJson);
			const docChildren = generateDocxChildren(structure);
			const doc = createDocxObject(docChildren);
			const docBuffer = await Packer.toBuffer(doc);
			
			return NextResponse.json({
				success: true,
				fileData: docBuffer.toString('base64'),
				fileName: "fixed_blog_post.docx"
			});
		}

		// MODE: INITIAL ANALYSIS
		const file = formData.get("file");
		if (!file) {
			return NextResponse.json(
				{ error: "No file uploaded" },
				{ status: 400 }
			);
		}

		// Convert file to buffer
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Extract text content with formatting using mammoth
		const result = await mammoth.convertToHtml({ buffer });
		const htmlContent = result.value;

		// Parse HTML to analyze structure
		const structure = analyzeDocumentStructure(htmlContent);

		// Validate SEO
		const seoValidation = validateSEO(structure);

		// Return analysis results for manual review (Step-by-Step)
		return NextResponse.json({
			success: true,
			rawStructure: structure, // CRITICAL: Send full structure for 1-by-1 review
			originalStructure: structure.map((item, i) => ({
				line: i + 1,
				content: item.content.substring(0, 100) + (item.content.length > 100 ? '...' : ''),
				type: 'Auto-detected'
			})),
			fixedStructure: structure.map((item, i) => ({
				line: i + 1,
				content: item.content.substring(0, 100) + (item.content.length > 100 ? '...' : ''),
				type: item.type
			})),
			seoValidation,
			fileName: file.name.replace('.docx', '_fixed.docx')
		});

	} catch (error) {
		console.error("Error processing document:", error);
		return NextResponse.json(
			{ error: "Failed to process document: " + error.message },
			{ status: 500 }
		);
	}
}

// HELPER: Convert HTML text with <strong> tags to docx TextRuns
function htmlToTextRuns(html, defaultBold = false) {
	if (!html) return [];
	
	const runs = [];
	// Regular expression to split text by <strong> or <b> tags
	// We use a non-capturing group for the split to keep the tags in the result
	const parts = html.split(/(<(?:strong|b)>.*?<\/(?:strong|b)>)/gi);
	
	parts.forEach(part => {
		if (!part) return;
		
		const strongMatch = part.match(/<(?:strong|b)>(.*?)<\/(?:strong|b)>/i);
		if (strongMatch) {
			// This part is bold
			runs.push(new TextRun({
				text: strongMatch[1].replace(/<[^>]+>/g, '').trim() + " ", // Strip any remaining tags inside
				bold: true,
				font: "Arial",
				size: 24
			}));
		} else {
			// This part is normal
			const text = part.replace(/<[^>]+>/g, '').trim();
			if (text) {
				runs.push(new TextRun({
					text: text + " ",
					bold: defaultBold,
					font: "Arial",
					size: 24
				}));
			}
		}
	});

	// If no bold tags found, return as a single run
	if (runs.length === 0 && html.replace(/<[^>]+>/g, '').trim()) {
		runs.push(new TextRun({
			text: html.replace(/<[^>]+>/g, '').trim(),
			bold: defaultBold,
			font: "Arial",
			size: 24
		}));
	}
	
	return runs;
}

// HELPER: Generate docx Paragraphs from structure
function generateDocxChildren(structure) {
	const docChildren = [];
	
	structure.forEach(item => {
		// Smart FAQ Q&A splitting - handles multiple formats
		if (item.type === 'H3' || item.type === 'P') {
			const split = smartSplitQA(item.content);
			
			if (split.hasQA) {
				// Create question paragraph (H3)
				docChildren.push(new Paragraph({
					children: [new TextRun({
						text: split.question,
						bold: true,
						size: 26,
						font: "Arial"
					})],
					heading: HeadingLevel.HEADING_3,
					style: "Heading3"
				}));
				
				// Create answer paragraph (P) if there's an answer
				if (split.answer) {
					docChildren.push(new Paragraph({
						children: htmlToTextRuns(item.innerHtml || split.answer, item.isBold),
					}));
				}
				return;
			}
		}
		
		// Default handling
		let paragraph;
		
		switch (item.type) {
			case 'H1':
				paragraph = new Paragraph({
					children: [new TextRun({
						text: item.content,
						bold: true,
						size: 32,
						font: "Arial"
					})],
					heading: HeadingLevel.HEADING_1,
					style: "Heading1"
				});
				break;
			case 'H2':
				paragraph = new Paragraph({
					children: [new TextRun({
						text: item.content,
						bold: true,
						size: 28,
						font: "Arial"
					})],
					heading: HeadingLevel.HEADING_2,
					style: "Heading2"
				});
				break;
			case 'H3':
				paragraph = new Paragraph({
					children: [new TextRun({
						text: item.content,
						bold: true,
						size: 26,
						font: "Arial"
					})],
					heading: HeadingLevel.HEADING_3,
					style: "Heading3"
				});
				break;
			case 'UL':
				paragraph = new Paragraph({
					children: htmlToTextRuns(item.innerHtml || item.content, item.isBold),
					bullet: {
						level: 0
					}
				});
				break;
			case 'OL':
				paragraph = new Paragraph({
					children: htmlToTextRuns(item.innerHtml || item.content, item.isBold),
					numbering: {
						reference: "main-numbering",
						level: 0,
					}
				});
				break;
			default:
				paragraph = new Paragraph({
					children: htmlToTextRuns(item.innerHtml || item.content, item.isBold),
				});
		}
		docChildren.push(paragraph);
	});
	
	return docChildren;
}

// HELPER: Create Document object with styles
function createDocxObject(children) {
	return new Document({
		numbering: {
			config: [
				{
					reference: "main-numbering",
					levels: [
						{
							level: 0,
							format: "decimal",
							text: "%1.",
							alignment: "left",
						},
					],
				},
			],
		},
		styles: {
			default: {
				document: {
					run: {
						font: "Arial",
						size: 24, // 12pt
					},
				},
			},
			paragraphStyles: [
				{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { font: "Arial", size: 32, bold: true, color: "000000" }, paragraph: { spacing: { after: 200, before: 400 } } },
				{ id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", run: { font: "Arial", size: 28, bold: true, color: "000000" }, paragraph: { spacing: { after: 150, before: 300 } } },
				{ id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", run: { font: "Arial", size: 26, bold: true, color: "000000" }, paragraph: { spacing: { after: 100, before: 200 } } },
			],
		},
		sections: [{ children }],
	});
}

// Smart Q&A Splitter - handles multiple FAQ formats
function smartSplitQA(text) {
	// Pattern 1: "1. Question? Answer text"
	// Pattern 2: "Q1 Answer text" or "Q1. Answer text"
	// Pattern 3: "Question 1: Answer text"
	// Pattern 4: Any text with "?" followed by more text
	
	// Check for numbered question with answer
	const patterns = [
		// "1. Question? Answer"
		/^(\d+[\.\)]\s+.*?\?)\s+(.{20,})$/,
		// "Q1 Answer" or "Q1. Answer"
		/^(Q\d+[\.\)]?\s+.*?)[\.\?]\s+(.{20,})$/i,
		// "Question 1: Answer"
		/^(Question\s+\d+[:\.]?\s+.*?[\?\.])\s+(.{20,})$/i,
		// Any question mark followed by substantial text
		/^(.*?\?)\s+(.{20,})$/,
	];
	
	for (const pattern of patterns) {
		const match = text.match(pattern);
		if (match && match[1] && match[2]) {
			let question = match[1].trim();
			let answer = match[2].trim();
			
			// Clean up question
			question = question.replace(/^(Q|Question)\s*\d+[\.\):]?\s*/i, '').trim();
			if (!question.endsWith('?')) {
				// If no question mark, check if it looks like a question
				const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'does', 'is', 'are'];
				const startsWithQuestion = questionWords.some(word => 
					question.toLowerCase().startsWith(word + ' ')
				);
				if (startsWithQuestion) {
					question += '?';
				}
			}
			
			// Clean up answer - remove "A:", "Answer:", "Ans:", etc.
			answer = answer.replace(/^(A|Answer|Ans)[:\.]?\s*/i, '').trim();
			
			return {
				hasQA: true,
				question: question,
				answer: answer
			};
		}
	}
	
	return { hasQA: false };
}

function analyzeDocumentStructure(html) {
	const structure = [];
	
	// Extract text from HTML paragraphs and list items using regex
	const paragraphRegex = /<(p|h[1-6]|li)(?:\s[^>]*)?>(.+?)<\/\1>/gi;
	
	let match;
	let h1Found = false;
	let introductionFound = false;
	let isFAQSection = false;
	const matches = [];

	// Extract all blocks
	while ((match = paragraphRegex.exec(html)) !== null) {
		const tagName = match[1].toUpperCase();
		const innerHtml = match[2];
		
		// Check for parent list type if it's an LI
		let listType = null;
		if (tagName === 'LI') {
			// Find the closest parent <ul> or <ol>
			const segment = html.substring(Math.max(0, match.index - 50), match.index);
			if (segment.toLowerCase().lastIndexOf('<ol') > segment.toLowerCase().lastIndexOf('<ul')) {
				listType = 'OL';
			} else {
				listType = 'UL';
			}
		}

		// Split by <br> or \n within paragraphs
		const subLines = innerHtml.split(/<br\s*\/?>|\n/gi);
		
		subLines.forEach(line => {
			// PRESERVE HTML for rich editing
			let contentWithHtml = line.trim();
			
			// Simple text for internal detection only
			let plainText = contentWithHtml.replace(/<[^>]+>/g, '').trim();
			
			// Skip empty content
			if (!plainText || plainText.length === 0) return;

			// SKIP UNWANTED CONTENT
			if (plainText.match(/^Image Link:/i)) return;
			if (plainText.match(/^(Meta Description|Meta Title|Slug|Category|Relevant Courses|Training):/i)) return;
			if (h1Found && plainText.match(/^(https?:\/\/|www\.|envato|adobestock)/i)) return;
			if (plainText.match(/^Reference/i)) return;

			const isBold = /<(strong|b)>/i.test(line);

			matches.push({ tagName, text: plainText, innerHtml: contentWithHtml, isBold, listType });
		});
	}

	// Analyze each match
	matches.forEach((item, index) => {
		const { tagName, text, innerHtml, isBold, listType } = item;
		let type = 'P'; // Default to paragraph

		if (listType) {
			type = listType;
		}
		// Rule 1: First meaningful content is always H1 (Title)
		else if (!h1Found) {
			type = 'H1';
			h1Found = true;
		} 
		// Rule 2: Force the very next content after H1 to be H2 (Introduction/First Section)
		else if (h1Found && !introductionFound) {
			type = 'H2';
			introductionFound = true;
		}
		// Rule 3: Detect FAQ Section early
		else if (text.match(/^(FAQs?|Frequently Asked Questions|1\.5\.|Question)/i)) {
			isFAQSection = true;
			type = 'H2'; // FAQ title is H2
		}
		// Rule 4: Detect headings by HTML tags (H1-H6)
		else if (tagName.match(/^H[1-6]$/)) {
			const level = parseInt(tagName.charAt(1));
			if (level === 1) {
				type = 'H2'; // Convert additional H1s to H2
			} else if (level === 2) {
				type = 'H2';
			} else if (level === 3) {
				type = 'H3';
			} else {
				type = 'H3'; // H4-H6 become H3
			}
		}
		// Rule 5: Heuristic detection for bold/short text
		else {
			const isShort = text.length < 100;
			const isAllCaps = text === text.toUpperCase() && text.length > 3;
			const hasQuestionMark = text.endsWith('?');
			
			if ((isBold && isShort && text.length > 10) || (isAllCaps && isShort)) {
				type = 'H2';
			}
			else if (isFAQSection && hasQuestionMark) {
				type = 'H3';
			}
			else if (text.match(/^\d+\./)) {
				type = 'H3';
			}
		}

		structure.push({ type, content: innerHtml, plainText: text, isBold });
	});

	return structure;
}

function validateSEO(structure) {
	const h1Count = structure.filter(item => item.type === 'H1').length;
	const h2Count = structure.filter(item => item.type === 'H2').length;
	const h3Count = structure.filter(item => item.type === 'H3').length;

	const issues = [];
	const warnings = [];

	// Check for single H1
	if (h1Count === 0) {
		issues.push("No H1 heading found. Every blog should have one main title.");
	} else if (h1Count > 1) {
		warnings.push(`Multiple H1 headings found (${h1Count}). First one kept, others converted to H2.`);
	}

	// Check heading hierarchy
	let lastHeadingLevel = 0;
	for (const item of structure) {
		if (item.type === 'H1') {
			lastHeadingLevel = 1;
		} else if (item.type === 'H2') {
			lastHeadingLevel = 2;
		} else if (item.type === 'H3') {
			if (lastHeadingLevel < 2) {
				issues.push(`H3 found without parent H2`);
			}
			lastHeadingLevel = 3;
		}
	}

	// Check heading distribution
	if (h2Count === 0) {
		warnings.push("No H2 headings found. Consider breaking content into main sections.");
	} else if (h2Count < 2) {
		warnings.push("Few H2 headings. Consider adding more main sections for better SEO.");
	}

	return {
		valid: issues.length === 0,
		score: calculateSEOScore(h1Count, h2Count, h3Count, issues.length, warnings.length),
		h1Count,
		h2Count,
		h3Count,
		issues,
		warnings
	};
}

function calculateSEOScore(h1Count, h2Count, h3Count, issueCount, warningCount) {
	let score = 100;
	
	// Deduct for issues
	if (h1Count !== 1) score -= 20;
	if (h2Count === 0) score -= 20;
	
	score -= issueCount * 10;
	score -= warningCount * 5;

	return Math.max(0, Math.min(100, score));
}
