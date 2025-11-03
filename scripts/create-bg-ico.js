/**
 * Script tạo BG.ico từ BG.png
 * Chạy: node scripts/create-bg-ico.js
 */

const fs = require('fs');
const path = require('path');

async function createBgIco() {
  try {
    const sharp = require('sharp');
    
    const bgPath = path.join(__dirname, '../public/BG.png');
    const icoPath = path.join(__dirname, '../public/BG.ico');

    // Kiểm tra BG.png
    if (!fs.existsSync(bgPath)) {
      console.error('❌ BG.png not found in public/');
      process.exit(1);
    }

    // Background color cho padding (theme color)
    const bgColor = { r: 10, g: 15, b: 31, alpha: 1 }; // #0A0F1F

    console.log('🔄 Creating BG.ico from BG.png...\n');

    // Tạo ICO bằng cách resize về 256x256 (size phổ biến cho ICO)
    // Lưu vào file tạm trước
    const tempPath = path.join(__dirname, '../public/BG-temp.png');
    
    await sharp(bgPath)
      .resize(256, 256, {
        fit: 'contain',
        background: bgColor,
        kernel: sharp.kernel.lanczos3
      })
      .png({
        quality: 100,
        compressionLevel: 6
      })
      .toFile(tempPath);

    // Copy file tạm thành BG.ico
    if (fs.existsSync(tempPath)) {
      fs.copyFileSync(tempPath, icoPath);
      fs.unlinkSync(tempPath);
      console.log(`✅ Created BG.ico (256x256) from BG.png`);
    }

    console.log('\n🎉 BG.ico created successfully!');
    console.log('⚠️  Note: Most browsers/PWA prefer PNG for icons');
    console.log('   Using ICO may not work in all browsers');

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

createBgIco();

