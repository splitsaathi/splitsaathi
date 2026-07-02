const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<script src=/g, '<script type="module" src=');
html = html.replace(/\s+defer/g, '');

const seoTitle = '<title>Splitsathi - Smart Expense Splitter App for Indians | Free Bill Splitting</title>';
const seoMeta = '<meta name="description" content="Splitsathi - India ka best expense splitting app. Group trips, bill splitting, UPI payments, aur friends ke saath expenses track karo. Free!" /><meta name="keywords" content="splitsathi, expense splitter india, bill splitting app, group expense tracker, splitwise alternative india, trip expense manager, UPI payment split" /><meta name="author" content="Splitsathi" /><meta name="robots" content="index, follow" /><link rel="canonical" href="https://splitsathi.com/" /><meta property="og:title" content="Splitsathi - Smart Expense Splitter" /><meta property="og:description" content="Group trips, shared bills, UPI settlements. India ka #1 free expense splitting app!" /><meta property="og:url" content="https://splitsathi.com" /><meta property="og:type" content="website" /><meta property="og:image" content="https://splitsathi.com/og-image.png" /><meta property="og:site_name" content="Splitsathi" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="Splitsathi - Smart Expense Splitter" /><meta name="twitter:description" content="Split bills, track group expenses, settle via UPI. Free app for Indians!" /><meta name="theme-color" content="#1a56db" /><meta name="mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-title" content="Splitsathi" /><meta name="google-site-verification" content="eaPklf5hlEGiO455s0fYLPJDbpgKMDRYWXYc6Q_O4yA" /><script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Splitsathi","url":"https://splitsathi.com","description":"India ka best expense splitting app for group trips, friends and family.","applicationCategory":"FinanceApplication","operatingSystem":"Web, Android, iOS","offers":{"@type":"Offer","price":"0","priceCurrency":"INR"},"aggregateRating":{"@type":"AggregateRating","ratingValue":"4.8","ratingCount":"1250"}}</script>';

html = html.replace('<title>SplitSaathi</title>', seoTitle + seoMeta);
html = html.replace('<title>Splitsathi - Smart Expense Splitter App for Indians | Free Bill Splitting</title><meta name="description"', seoTitle + seoMeta.replace('<meta name="description"', '<!-- updated --><meta name="description"'));

fs.writeFileSync(indexPath, html);
console.log('✅ Fixed: type=module added');
console.log('✅ SEO meta tags updated for Splitsathi');

const adminDir = path.join(__dirname, 'dist', 'admin');
fs.mkdirSync(adminDir, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'admin-panel.html'), path.join(adminDir, 'index.html'));
console.log('✅ Admin panel created at dist/admin/index.html');

const sitemap = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://splitsathi.com/</loc><lastmod>' + new Date().toISOString().split('T')[0] + '</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url></urlset>';
fs.writeFileSync(path.join(__dirname, 'dist', 'sitemap.xml'), sitemap);
console.log('✅ sitemap.xml created for splitsathi.com');

const robots = 'User-agent: *\nAllow: /\nSitemap: https://splitsathi.com/sitemap.xml';
fs.writeFileSync(path.join(__dirname, 'dist', 'robots.txt'), robots);
console.log('✅ robots.txt created');

const cname = 'splitsathi.com';
fs.writeFileSync(path.join(__dirname, 'dist', 'CNAME'), cname);
console.log('✅ CNAME created: splitsathi.com');
// Auto update docs/index.html with correct hash
const docsIndexPath = path.join(__dirname, 'docs', 'index.html');
if (fs.existsSync(docsIndexPath)) {
  let docsHtml = fs.readFileSync(docsIndexPath, 'utf8');
  docsHtml = docsHtml.replace(/<script type="module" src=".*AppEntry.*\.js"><\/script>/, `<script type="module" src="${html.match(/AppEntry-[a-z0-9]+\.js/)[0].replace(/.*AppEntry/, '/_expo/static/js/web/AppEntry')}"></script>`);
  fs.writeFileSync(docsIndexPath, docsHtml);
  console.log('✅ docs/index.html AppEntry hash updated');
}
