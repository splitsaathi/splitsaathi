const fs = require('fs');
const path = require('path');

// Fix 1: Add type=module to index.html
const indexPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<script src=/g, '<script type="module" src=');
html = html.replace(/\s+defer/g, '');
fs.writeFileSync(indexPath, html);
console.log('✅ Fixed: type=module added');

// Fix 2: Create admin panel
const adminDir = path.join(__dirname, 'dist', 'admin');
fs.mkdirSync(adminDir, { recursive: true });
fs.copyFileSync(
  path.join(__dirname, 'admin-panel.html'),
  path.join(adminDir, 'index.html')
);
console.log('✅ Admin panel created at dist/admin/index.html');