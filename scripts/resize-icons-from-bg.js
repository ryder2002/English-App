/**
 * Script resize BG.png thành PWA icons (192x192, 512x512)
 * Chạy: node scripts/resize-icons-from-bg.js
 */

const fs = require('fs');
const path = require('path');

async function resizeIcons() {
  try {
    const sharp = require('sharp');
    
    const bgPath = path.join(__dirname, '../public/BG.png');
    const iconsDir = path.join(__dirname, '../public/icons');

    // Tạo thư mục icons nếu chưa có
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
      console.log('✅ Created icons directory');
    }

    // Kiểm tra BG.png
    if (!fs.existsSync(bgPath)) {
      console.error('❌ BG.png not found in public/');
      process.exit(1);
    }

    // Background color cho padding (theme color)
    const bgColor = { r: 10, g: 15, b: 31, alpha: 1 }; // #0A0F1F

    console.log('🔄 Resizing PWA icons from BG.png...\n');

    // PWA icon sizes
    const pwaSizes = [
      { size: 192, name: 'icon-192.png' },
      { size: 512, name: 'icon-512.png' }
    ];

    for (const { size, name } of pwaSizes) {
      const outputPath = path.join(iconsDir, name);
      await sharp(bgPath)
        .resize(size, size, {
          fit: 'contain',
          background: bgColor
        })
        .png()
        .toFile(outputPath);
      console.log(`✅ Created ${name} (${size}x${size}) from BG.png`);
    }

    console.log('\n🎉 PWA icons created successfully from BG.png!');
    console.log('✨ Icons are ready for PWA installation (desktop & mobile)!');

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ Sharp not installed!');
      console.error('   Run: npm install sharp --save-dev');
      process.exit(1);
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

resizeIcons();

