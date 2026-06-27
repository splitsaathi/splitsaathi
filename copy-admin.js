const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'dist', 'admin');
const srcFile = path.join(__dirname, 'dist', 'admin', 'index.html');

// Admin folder already exists with index.html from git
if (fs.existsSync(srcFile)) {
  console.log('✅ Admin panel already exists at dist/admin/index.html');
} else {
  // Create from the admin HTML content
  fs.mkdirSync(adminDir, { recursive: true });
  console.log('✅ Admin directory created');
}