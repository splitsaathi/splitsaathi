const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<script src=/g, '<script type="module" src=');
html = html.replace(/\s+defer/g, '');
fs.writeFileSync(indexPath, html);
console.log('✅ Fixed: type=module added');

const adminDir = path.join(__dirname, 'dist', 'admin');
fs.mkdirSync(adminDir, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'admin-panel.html'), path.join(adminDir, 'index.html'));
console.log('✅ Admin panel created at dist/admin/index.html');

const sitemap = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://splitsathi.com/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url></urlset>';
fs.writeFileSync(path.join(__dirname, 'dist', 'sitemap.xml'), sitemap);
console.log('✅ sitemap.xml created');

const robots = 'User-agent: *\nAllow: /\nSitemap: https://splitsathi.com/sitemap.xml';
fs.writeFileSync(path.join(__dirname, 'dist', 'robots.txt'), robots);
console.log('✅ robots.txt created');

fs.writeFileSync(path.join(__dirname, 'dist', 'CNAME'), 'splitsathi.com');
console.log('✅ CNAME created');