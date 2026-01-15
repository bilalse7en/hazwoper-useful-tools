const fs = require('fs');

console.log('Fixing copyText function in preview-drawer.jsx...');
let content = fs.readFileSync('src/components/preview-drawer.jsx', 'utf8');

// Find and replace the copyText function (lines 28-30)
const lines = content.split('\n');
const newLines = [];

for (let i = 0; i < lines.length; i++) {
	if (i === 27) { // Line 28 (0-indexed)
		// Replace lines 28-30 with new implementation
		newLines.push('\tconst copyText=async (text) => {');
		newLines.push('\t\t// Process anchor tags to add SEO attributes before copying');
		newLines.push('\t\tlet processedText = text.replace(/\\<a\\s+(?:[^\\>]*?\\s+)?href=(["\'])(.*?)\\1([^\\>]*)\\>/gi,(match,p1,p2,p3) => {');
		newLines.push('\t\t\t// Remove any existing target or rel attributes');
		newLines.push('\t\t\tlet cleanP3=p3.replace(/\\s+(target|rel)=["\'][^"\']*?["\']/gi,\'\').trim();');
		newLines.push('\t\t\t');
		newLines.push('\t\t\t// Check if this is an internal link (hazwoper-osha.com)');
		newLines.push('\t\t\tconst isInternalLink = p2.toLowerCase().includes(\'hazwoper-osha.com\');');
		newLines.push('\t\t\t');
		newLines.push('\t\t\t// Build the new anchor tag');
		newLines.push('\t\t\tlet newTag=\'\\<a href=\"\'+p2+\'\" target=\"_blank\"\';');
		newLines.push('\t\t\t');
		newLines.push('\t\t\t// Add rel="noopener noreferrer" only for external links (SEO best practice)');
		newLines.push('\t\t\tif (!isInternalLink) {');
		newLines.push('\t\t\t\tnewTag+=\' rel="noopener noreferrer"\';');
		newLines.push('\t\t\t}');
		newLines.push('\t\t\t');
		newLines.push('\t\t\tif(cleanP3) newTag+=\' \'+cleanP3;');
		newLines.push('\t\t\tnewTag+=\'\\>\';');
		newLines.push('\t\t\treturn newTag;');
		newLines.push('\t\t});');
		newLines.push('\t\t');
		newLines.push('\t\t// Replace all &nbsp; with regular space for cleaner code');
		newLines.push('\t\tprocessedText = processedText.replace(/&nbsp;/g, \' \');');
		newLines.push('\t\t');
		newLines.push('\t\tawait navigator.clipboard.writeText(processedText);');
		newLines.push('\t};');
		
		// Skip the next 2 lines (original function lines 29-30)
		i += 2;
	} else {
		newLines.push(lines[i]);
	}
}

fs.writeFileSync('src/components/preview-drawer.jsx', newLines.join('\n'), 'utf8');
console.log('✅ copyText function updated successfully!');
