// fix-index-module.js  (self-healing version)
// Run this AFTER the xcopy step, BEFORE git push.
// Fixes docs/index.html so the AppEntry script tag always has:
//   1. A space between "script" and "src="  (in case an older run mangled it)
//   2. type="module"  (Expo's web export doesn't add this by default)
// Safe to run any number of times — always converges to the correct tag.

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'docs', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('❌ docs/index.html not found. Did you run the build + copy steps first?');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');
const original = html;

// Step 1: repair "<scriptsrc=" (missing space) if present, from any earlier bad run
html = html.replace(/<script(?=src=)/gi, '<script ');

// Step 2: find the AppEntry script tag and ensure it has type="module"
const scriptTagRegex = /<script([^>]*src="[^"]*AppEntry-[^"]*\.js"[^>]*)>/i;
const match = html.match(scriptTagRegex);

if (!match) {
  console.error('❌ Could not find AppEntry script tag in index.html. Check the file manually.');
  process.exit(1);
}

let attrs = match[1];
if (!/type\s*=\s*"module"/i.test(attrs)) {
  const newAttrs = attrs + ' type="module"';
  html = html.replace(scriptTagRegex, `<script${newAttrs}>`);
}

if (html === original) {
  console.log('✅ Already correct — nothing to fix.');
} else {
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✅ Fixed docs/index.html (space + type="module" both verified).');
}

// Show the final tag so you can eyeball it before committing
const finalMatch = html.match(/<script[^>]*AppEntry[^>]*>/i);
console.log('Final tag:', finalMatch ? finalMatch[0] : '(not found)');
