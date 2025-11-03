/**
 * Script tạo lại favicons từ Logo.png (đảm bảo favicon dùng Logo.png)
 * Chạy: node scripts/fix-favicon-from-logo.js
 */

const fs = require('fs');
const path = require('path');

async function recreateFavicons() {
  try {
    const sharp = require('sharp');
    
    const logoPath = path.join(__dirname, '../public/Logo.png');
    const publicDir = path.join(__dirname, '../public');

    // Kiểm tra Logo.png
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Logo.png not found in public/');
      process.exit(1);
    }

    // Background color cho padding (theme color)
    const bgColor = { r: 10, g: 15, b: 31, alpha: 1 }; // #0A0F1F

    console.log('🔄 Creating favicons from Logo.png...\n');

    // Favicon.ico (32x32)
    const faviconIcoPath = path.join(publicDir, 'favicon.ico');
    await sharp(logoPath)
      .resize(32, 32, {
        fit: 'contain',
        background: bgColor
      })
      .png()
      .toFile(faviconIcoPath);
    console.log(`✅ Created favicon.ico (32x32) from Logo.png`);

    // Favicon sizes cần thiết
    const faviconSizes = [32, 96];
    
    for (const size of faviconSizes) {
      const outputPath = path.join(publicDir, `favicon-${size}x${size}.png`);
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: bgColor
        })
        .png()
        .toFile(outputPath);
      console.log(`✅ Created favicon-${size}x${size}.png from Logo.png`);
    }

    // Apple touch icon (180x180)
    const appleIconPath = path.join(publicDir, 'apple-touch-icon.png');
    await sharp(logoPath)
      .resize(180, 180, {
        fit: 'contain',
        background: bgColor
      })
      .png()
      .toFile(appleIconPath);
    console.log(`✅ Created apple-touch-icon.png (180x180) from Logo.png`);

    console.log('\n🎉 All favicons created successfully from Logo.png!');
    console.log('✨ Favicons are ready for browser tabs!');

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

recreateFavicons();

