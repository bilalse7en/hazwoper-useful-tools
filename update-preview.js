const fs = require('fs');

console.log('Updating preview-drawer.jsx copyText function...');
let content = fs.readFileSync('src/components/preview-drawer.jsx', 'utf8');

// Replace the copyText function with SEO processing
const oldCopyText = /const copyText=async \(text\) => \{[\s\S]*?await navigator\.clipboard\.writeText\(text\);\s*\};/;

const newCopyText = `const copyText=async (text) => {
		// Process anchor tags to add SEO attributes before copying
		let processedText = text.replace(/\\<a\\s+(?:[^\\>]*?\\s+)?href=(["\'])(.*?)\\1([^\\>]*)\\>/gi,(match,p1,p2,p3) => {
			// Remove any existing target or rel attributes
			let cleanP3=p3.replace(/\\s+(target|rel)=["\'][^"\']*?["\']/gi,'').trim();
			
			// Check if this is an internal link (hazwoper-osha.com)
			const isInternalLink = p2.toLowerCase().includes('hazwoper-osha.com');
			
			// Build the new anchor tag
			let newTag='\\<a href="'+p2+'" target="_blank"';
			
			// Add rel="noopener noreferrer" only for external links (SEO best practice)
			if (!isInternalLink) {
				newTag+=' rel="noopener noreferrer"';
			}
			
			if(cleanP3) newTag+=' '+cleanP3;
			newTag+='\\>';
			return newTag;
		});
		
		// Replace all &nbsp; with regular space for cleaner code
		processedText = processedText.replace(/&nbsp;/g, ' ');
		
		await navigator.clipboard.writeText(processedText);
	};`;

content = content.replace(oldCopyText, newCopyText);
fs.writeFileSync('src/components/preview-drawer.jsx', content, 'utf8');
console.log('✅ copyText function updated with SEO processing!');
