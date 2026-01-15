const fs = require('fs');

console.log('Fixing preview-drawer.jsx JSX structure...');
let content = fs.readFileSync('src/components/preview-drawer.jsx', 'utf8');

// Fix: Add missing </div> after </pre> on line 98
content = content.replace(
  /(<\/pre>)\r?\n(\t+<Button)/,
  '$1\r\n\t\t\t\t\t\t\t\t\t\t\t\t</div>\r\n$2'
);

fs.writeFileSync('src/components/preview-drawer.jsx', content, 'utf8');
console.log('✅ Fixed! Missing </div> tag added.');
