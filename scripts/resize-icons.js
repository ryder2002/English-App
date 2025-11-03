/**
 * Script để resize Logo.png thành các kích thước icon cần thiết
 * Yêu cầu: npm install sharp (hoặc dùng tool online)
 * 
 * Chạy: node scripts/resize-icons.js
 */

const fs = require('fs');
const path = require('path');

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 64, name: 'favicon-64x64.png' },
  { size: 96, name: 'favicon-96x96.png' },
  { size: 128, name: 'favicon-128x128.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 256, name: 'icon-256x256.png' },
  { size: 512, name: 'icon-512x512.png' },
];

const logoPath = path.join(__dirname, '../public/Logo.png');
const outputDir = path.join(__dirname, '../public/icons');

console.log('📋 Hướng dẫn resize icons:');
console.log('');
console.log('1. Cài đặt Sharp:');
console.log('   npm install sharp --save-dev');
console.log('');
console.log('2. Hoặc sử dụng tool online:');
console.log('   - https://www.resizepixel.com/');
console.log('   - https://www.iloveimg.com/resize-image');
console.log('   - https://squoosh.app/');
console.log('');
console.log('3. Resize Logo.png thành các sizes sau:');
sizes.forEach(({ size, name }) => {
  console.log(`   - ${size}x${size} → ${name}`);
});
console.log('');
console.log('4. Lưu tất cả vào thư mục: public/icons/');
console.log('');
console.log('5. Sau đó chạy lại script này để cập nhật manifest.json');

// Check if sharp is available
try {
  const sharp = require('sharp');
  
  if (!fs.existsSync(logoPath)) {
    console.error('❌ Logo.png not found in public/');
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('✅ Sharp found! Resizing images...');
  
  async function resizeIcons() {
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 10, g: 15, b: 31, alpha: 1 } // #0A0F1F
        })
        .png()
        .toFile(outputPath);
      console.log(`✅ Created ${name}`);
    }
    console.log('');
    console.log('🎉 All icons created successfully!');
    console.log('📝 Now update manifest.json to use /icons/icon-*.png');
  }

  resizeIcons().catch(console.error);
} catch (e) {
  console.log('⚠️  Sharp not installed. Please follow manual instructions above.');
}

