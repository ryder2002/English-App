/**
 * Script tạo BG.ico từ BG.png với kích thước gốc (không resize)
 * Chạy: node scripts/create-bg-ico-original.js
 */

const fs = require('fs');
const path = require('path');

async function createBgIcoOriginal() {
  try {
    const sharp = require('sharp');
    
    const bgPath = path.join(__dirname, '../public/BG.png');
    const icoPath = path.join(__dirname, '../public/BG.ico');

    // Kiểm tra BG.png
    if (!fs.existsSync(bgPath)) {
      console.error('❌ BG.png not found in public/');
      process.exit(1);
    }

    // Lấy metadata để biết kích thước gốc
    const metadata = await sharp(bgPath).metadata();
    const width = metadata.width;
    const height = metadata.height;

    console.log(`🔄 Creating BG.ico from BG.png (original size: ${width}x${height})...\n`);

    // Tạo file tạm với kích thước gốc
    const tempPath = path.join(__dirname, '../public/BG-temp.png');
    
    // Copy BG.png thành BG.ico (giữ nguyên kích thước)
    await sharp(bgPath)
      .png({
        quality: 100,
        compressionLevel: 6
      })
      .toFile(tempPath);

    // Copy file tạm thành BG.ico
    if (fs.existsSync(tempPath)) {
      fs.copyFileSync(tempPath, icoPath);
      fs.unlinkSync(tempPath);
      console.log(`✅ Created BG.ico (${width}x${height}) from BG.png - original size`);
    }

    console.log('\n🎉 BG.ico created successfully with original size!');
    console.log('⚠️  Note: PWA manifest.json typically requires PNG format');
    console.log('   ICO format may not work for PWA icons');

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

createBgIcoOriginal();

