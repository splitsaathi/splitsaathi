const fs = require('fs');
fs.mkdirSync('dist/admin', { recursive: true });
fs.copyFileSync('dist/admin.html', 'dist/admin/index.html');
console.log('✅ Admin panel copied to dist/admin/index.html');