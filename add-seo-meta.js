// add-seo-meta.js
// Injects SEO meta tags into docs/index.html after every `expo export`.
// Run this AFTER fix-index-module.js in your build chain.
//
// Usage: node add-seo-meta.js

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, 'docs', 'index.html');

const SEO_TAGS = `
    <meta name="google-site-verification" content="9gMzF0CUSNY8B9pSufLTXbP90kKxXm7IB5L_fwLOhB8" />
    <title>SplitSaathi — Split Trip & Group Expenses Easily | Free Bill Splitting App</title>
    <meta name="description" content="SplitSaathi helps friends, roommates, and travel groups split expenses fairly and settle up instantly via UPI. Free expense tracker for trips, homes, and group outings across India and worldwide." />
    <meta name="keywords" content="split expenses, expense splitting app, split bills with friends, group expense tracker, trip expense splitter, splitwise alternative India, UPI split payment, roommate expense app, travel expense sharing" />
    <link rel="canonical" href="https://www.splitsathi.com/" />

    <!-- Open Graph / Facebook / WhatsApp preview -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.splitsathi.com/" />
    <meta property="og:title" content="SplitSaathi — Split Trip & Group Expenses Easily" />
    <meta property="og:description" content="Split expenses with friends, roommates, and travel groups. Track shared bills, settle up via UPI, explore 2000+ trip destinations — all free." />
    <meta property="og:image" content="https://www.splitsathi.com/og-image.png" />
    <meta property="og:locale" content="en_IN" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="SplitSaathi — Split Trip & Group Expenses Easily" />
    <meta name="twitter:description" content="Split expenses with friends, roommates, and travel groups. Track shared bills, settle up via UPI — all free." />
    <meta name="twitter:image" content="https://www.splitsathi.com/og-image.png" />

    <!-- Structured data for Google -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "SplitSaathi",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR"
      },
      "description": "Split expenses with friends, roommates, and travel groups. Track shared bills and settle up via UPI."
    }
    </script>
`;

let html = fs.readFileSync(INDEX_PATH, 'utf8');

// Remove any existing <title> Expo puts in (so we don't end up with two)
html = html.replace(/<title>.*?<\/title>/is, '');

// Remove our own tags if this script already ran before (so re-running is safe)
html = html.replace(/\n?\s*<title>SplitSaathi[\s\S]*?<\/script>\n/, '');

if (html.includes('</head>')) {
  html = html.replace('</head>', `${SEO_TAGS}\n  </head>`);
  fs.writeFileSync(INDEX_PATH, html, 'utf8');
  console.log('✅ SEO meta tags injected into docs/index.html');
} else {
  console.error('❌ Could not find </head> in docs/index.html — SEO tags NOT added.');
}
