import mammoth from "mammoth";

/**
 * Common utilities for cleaning HTML from mammoth
 */
export function consolidateLists(html) {
	if (!html) return "";
	// Merge adjacent </ul><ul> or </ol><ol>
	return html
		.replace(/<\/ul>\s*<ul>/g, "")
		.replace(/<\/ol>\s*<ol>/g, "")
		.replace(/<p>&nbsp;<\/p>/g, "")
		.trim();
}

/**
 * ==========================================
 * BLOG & FAQ PROCESSOR
 * ==========================================
 */

export async function processBlogFile(file) {
	const arrayBuffer = await file.arrayBuffer();
	const result = await mammoth.convertToHtml({ arrayBuffer });
	let html = result.value;
	
	// Basic cleaning
	html = consolidateLists(html);
	
	const rawStructure = extractBlogFAQContent(html);
	const { blogHtml, faqHtml } = splitBlogAndFAQ(html);
	
	return {
		blogHtml,
		faqHtml,
		fullHtml: html,
		rawStructure,
		messages: result.messages
	};
}

export function splitBlogAndFAQ(html) {
	const faqMarkers = [
		/<h2>\s*FAQ\s*<\/h2>/i,
		/<h1>\s*FAQ\s*<\/h1>/i,
		/<h2>\s*Frequently\s+Asked\s+Questions\s*<\/h2>/i,
		/<h3>\s*FAQ\s*<\/h3>/i
	];

	let splitIndex = -1;
	for (const marker of faqMarkers) {
		const match = html.match(marker);
		if (match) {
			splitIndex = match.index;
			break;
		}
	}

	if (splitIndex === -1) {
		return { blogHtml: html, faqHtml: "" };
	}

	return {
		blogHtml: html.substring(0, splitIndex).trim(),
		faqHtml: html.substring(splitIndex).trim()
	};
}

export function generateBlogCode(html) {
	if (!html) return "";
	return html;
}

export function generateBlogFAQCode(html) {
	if (!html) return "";
	return html;
}

export function extractBlogFAQContent(html) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	const blocks = [];
	
	doc.body.childNodes.forEach(node => {
		if (node.nodeType === 1) { // ELEMENT_NODE
			blocks.push({
				type: node.tagName.toUpperCase(),
				content: node.innerHTML,
				text: node.textContent.trim()
			});
		} else if (node.nodeType === 3 && node.textContent.trim()) { // TEXT_NODE
			blocks.push({
				type: 'P',
				content: node.textContent.trim(),
				text: node.textContent.trim()
			});
		}
	});
	
	return blocks;
}

/**
 * ==========================================
 * GLOSSARY PROCESSOR
 * ==========================================
 */

export async function processGlossaryFile(file, onProgress) {
	const arrayBuffer = await file.arrayBuffer();
	if (onProgress) onProgress(50);
	
	const result = await mammoth.convertToHtml({ arrayBuffer });
	const html = consolidateLists(result.value);
	
	if (onProgress) onProgress(100);

	// Parse terms and definitions
	// Expects format: Term - Definition or Term: Definition
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	const terms = [];
	
	doc.body.querySelectorAll('p, li').forEach(node => {
		const text = node.textContent.trim();
		if (!text) return;
		
		let term = "";
		let definition = "";
		
		if (text.includes(" - ")) {
			[term, ...definition] = text.split(" - ");
			definition = definition.join(" - ");
		} else if (text.includes(": ")) {
			[term, ...definition] = text.split(": ");
			definition = definition.join(": ");
		} else {
			term = text;
		}
		
		if (term) {
			terms.push({ 
				term: term.trim(), 
				definition: (definition || "").trim() 
			});
		}
	});
	
	return terms;
}

export function generateGlossaryCode(terms) {
	if (!terms || !terms.length) return "";
	
	let html = '<div class="glossary-container">\n';
	terms.forEach(item => {
		html += `  <div class="glossary-item">\n`;
		html += `    <h3 class="glossary-term">${item.term}</h3>\n`;
		html += `    <p class="glossary-definition">${item.definition}</p>\n`;
		html += `  </div>\n`;
	});
	html += '</div>';
	
	return html;
}

/**
 * ==========================================
 * COURSE PROCESSOR
 * ==========================================
 */

export async function processCourseFile(file) {
	const arrayBuffer = await file.arrayBuffer();
	const result = await mammoth.convertToHtml({ arrayBuffer });
	const html = consolidateLists(result.value);
	
	return {
		overviewHtml: html,
		objectivesHtml: "",
		syllabusHtml: "",
		faqHtml: "",
		mainPointsHtml: "",
		fullHtml: html
	};
}

export function generateOverviewCode(data) { return data.overviewHtml || ""; }
export function generateCourseObjectivesCode(data) { return data.objectivesHtml || ""; }
export function generateSyllabusCode(data) { return data.syllabusHtml || ""; }
export function generateFAQCode(data) { return data.faqHtml || ""; }
export function generateMainPointsCode(data) { return data.mainPointsHtml || ""; }
