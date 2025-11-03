/**
 * Script tạo placeholder icons từ Logo.png
 * Copy Logo.png thành icon-192.png và icon-512.png (tạm thời)
 * 
 * CHẠY: node scripts/create-placeholder-icons.js
 */

const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '../public/Logo.png');
const iconsDir = path.join(__dirname, '../public/icons');
const icon192Path = path.join(iconsDir, 'icon-192.png');
const icon512Path = path.join(iconsDir, 'icon-512.png');

// Tạo thư mục icons nếu chưa có
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('✅ Created icons directory');
}

// Kiểm tra Logo.png có tồn tại không
if (!fs.existsSync(logoPath)) {
  console.error('❌ Logo.png not found in public/');
  console.error('   Path:', logoPath);
  process.exit(1);
}

try {
  // Copy Logo.png thành icon-192.png và icon-512.png (tạm thời)
  // Lưu ý: Đây chỉ là placeholder, icon vẫn cần được resize đúng kích thước
  fs.copyFileSync(logoPath, icon192Path);
  fs.copyFileSync(logoPath, icon512Path);
  
  console.log('✅ Created placeholder icons:');
  console.log('   - icon-192.png (từ Logo.png)');
  console.log('   - icon-512.png (từ Logo.png)');
  console.log('');
  console.log('⚠️  LƯU Ý: Các icon này vẫn là Logo.png gốc (2125x1908px)');
  console.log('   Để icon hiển thị đúng, cần resize về đúng kích thước:');
  console.log('   - icon-192.png → 192x192 pixels');
  console.log('   - icon-512.png → 512x512 pixels');
  console.log('');
  console.log('   Xem hướng dẫn: QUICK_FIX_PWA_ICON.md');
} catch (error) {
  console.error('❌ Error creating icons:', error.message);
  process.exit(1);
}

