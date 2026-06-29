const fs = require('fs');
const path = require('path');

// Fix 1: Add type=module to index.html
const indexPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<script src=/g, '<script type="module" src=');
html = html.replace(/\s+defer/g, '');

// Fix 2: Add SEO meta tags
const seoTags = `
  <!-- SEO Meta Tags -->
  <meta name="description" content="SplitSaathi - India ka best expense splitting app. Group trips, bill splitting, UPI payments, aur friends ke saath expenses track karo. Free mein download karo!" />
  <meta name="keywords" content="expense splitter india, bill splitting app, group expense tracker, splitwise alternative india, trip expense manager, UPI payment split, friend bill share, SplitSaathi" />
  <meta name="author" content="SplitSaathi" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://splitsaathi.com/" />

  <!-- Open Graph (WhatsApp, Facebook sharing) -->
  <meta property="og:title" content="SplitSaathi - Smart Expense Splitter for Indians" />
  <meta property="og:description" content="Group trips, shared bills, UPI settlements — sabkuch ek jagah. India ka #1 free expense splitting app!" />
  <meta property="og:url" content="https://splitsaathi.com" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://splitsaathi.com/og-image.png" />
  <meta property="og:locale" content="en_IN" />
  <meta property="og:site_name" content="SplitSaathi" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="SplitSaathi - Smart Expense Splitter" />
  <meta name="twitter:description" content="Split bills, track group expenses, settle via UPI. Free app for Indians!" />
  <meta name="twitter:image" content="https://splitsaathi.com/og-image.png" />

  <!-- PWA / Mobile -->
  <meta name="theme-color" content="#1a56db" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="SplitSaathi" />

  <!-- Structured Data (Google Rich Results) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "SplitSaathi",
    "url": "https://splitsaathi.com",
    "description": "India ka best expense splitting app for group trips, friends and family. Split bills, track expenses, settle via UPI.",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web, Android, iOS",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250"
    },
    "featureList": [
      "Group expense splitting",
      "UPI payment integration",
      "Trip expense tracking",
      "Bill scanner with OCR",
      "Multi-currency support"
    ]
  }
  </script>
`;

// SEO tags <title> ke baad inject karo
html = html.replace(
  '<title>SplitSaathi</title>',
  '<title>SplitSaathi - Smart Expense Splitter App for Indians | Free Bill Splitting</title>' + seoTags
);

fs.writeFileSync(indexPath, html);
console.log('✅ Fixed: type=module added');
console.log('✅ SEO meta tags added');

// Fix 3: Create admin panel
const adminDir = path.join(__dirname, 'dist', 'admin');
fs.mkdirSync(adminDir, { recursive: true });
fs.copyFileSync(
  path.join(__dirname, 'admin-panel.html'),
  path.join(adminDir, 'index.html')
);
console.log('✅ Admin panel created at dist/admin/index.html');

// Fix 4: Create sitemap.xml
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://splitsaathi.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
fs.writeFileSync(path.join(__dirname, 'dist', 'sitemap.xml'), sitemap);
console.log('✅ sitemap.xml created');

// Fix 5: Create robots.txt
const robots = `User-agent: *
Allow: /
Sitemap: https://splitsaathi.com/sitemap.xml`;
fs.writeFileSync(path.join(__dirname, 'dist', 'robots.txt'), robots);
console.log('✅ robots.txt created');
