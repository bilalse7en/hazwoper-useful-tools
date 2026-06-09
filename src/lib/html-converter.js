/**
 * Industrial-Grade Technical HTML Converter
 * Converts technical Markdown into professional Semantic HTML
 */
export function markdownToHtml(md) {
  if (!md) return '';

  let html = md;

  // 1. Technical Tables (Pipe notation)
  html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
    const cells = content.split('|').map((c) => c.trim());
    return `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
  });

  // Wrap table rows
  html = html.replace(/(?:<tr>[\s\S]*?<\/tr>\n?)+/g, (match) => {
    return `<div class="industrial-table-wrapper"><table class="technical-data-table">\n${match}</table></div>`;
  });

  // 2. Blockquotes (Industrial Insights)
  html = html.replace(/^\>\s+(.+)$/gm, (match, content) => {
    return `<blockquote class="professional-insight"><q>${content}</q></blockquote>`;
  });

  // 3. Headings (Authority Structure)
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // 4. Bold / Emphasis
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // 5. Lists (Checklists / Procedures)
  html = html.replace(/^\s*\*\s+(.*$)/gm, '<li>$1</li>');
  html = html.replace(/^\s*-\s+(.*$)/gm, '<li>$1</li>');

  // Wrap list items
  html = html.replace(/(?:<li>[\s\S]*?<\/li>\n?)+/g, (match) => {
    return `<ul class="technical-checklist">\n${match}</ul>`;
  });

  // 6. Paragraphs (Executive Text)
  // Split by double newlines and wrap if not already an HTML tag
  html = html
    .split(/\n\s*\n/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return trimmed;
      return `<p>${trimmed.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');

  return html;
}
