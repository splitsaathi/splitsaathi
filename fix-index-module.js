// fix-index-module.js
// Run this AFTER `node copy-admin.js` and the xcopy step, BEFORE git push.
// It finds the AppEntry-*.js script tag in docs/index.html and ensures it has type="module".

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'docs', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('❌ docs/index.html not found. Did you run the build + copy steps first?');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// Match any <script ...src="...AppEntry-....js"...></script> tag (any attribute order)
const scriptTagRegex = /<script([^>]*src="[^"]*AppEntry-[^"]*\.js"[^>]*)>/i;

const match = html.match(scriptTagRegex);

if (!match) {
  console.error('❌ Could not find AppEntry script tag in index.html. Check the file manually.');
  process.exit(1);
}

let attrs = match[1];

if (/type\s*=\s*"module"/i.test(attrs)) {
  console.log('✅ type="module" already present. Nothing to do.');
  process.exit(0);
}

// Remove defer/async if present (type=module is deferred by default, but harmless either way)
// Just append type="module" to the attributes
const newAttrs = attrs.trim() + ' type="module"';
const newTag = `<script${newAttrs}>`;

html = html.replace(scriptTagRegex, newTag);

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ Fixed: type="module" added to AppEntry script tag in docs/index.html');
