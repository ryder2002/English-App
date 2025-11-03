/**
 * Script resize Logo.png thành tất cả icons cần thiết cho favicon và PWA
 * Chạy: node scripts/resize-all-icons.js
 */

const fs = require('fs');
const path = require('path');

async function resizeIcons() {
  try {
    // Import sharp
    const sharp = require('sharp');
    
    const logoPath = path.join(__dirname, '../public/Logo.png');
    const iconsDir = path.join(__dirname, '../public/icons');
    const publicDir = path.join(__dirname, '../public');

    // Tạo thư mục icons nếu chưa có
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
      console.log('✅ Created icons directory');
    }

    // Kiểm tra Logo.png
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Logo.png not found in public/');
      process.exit(1);
    }

    // Background color cho padding (theme color)
    const bgColor = { r: 10, g: 15, b: 31, alpha: 1 }; // #0A0F1F

    console.log('🔄 Resizing icons from Logo.png...\n');

    // Favicon sizes (cho browser tabs)
    const faviconSizes = [16, 32, 48, 64, 96, 128];
    
    for (const size of faviconSizes) {
      const outputPath = path.join(publicDir, `favicon-${size}x${size}.png`);
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: bgColor
        })
        .png()
        .toFile(outputPath);
      console.log(`✅ Created favicon-${size}x${size}.png`);
    }

    // PWA icon sizes
    const pwaSizes = [
      { size: 192, name: 'icon-192.png' },
      { size: 512, name: 'icon-512.png' }
    ];

    for (const { size, name } of pwaSizes) {
      const outputPath = path.join(iconsDir, name);
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: bgColor
        })
        .png()
        .toFile(outputPath);
      console.log(`✅ Created ${name} (${size}x${size})`);
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
    console.log(`✅ Created apple-touch-icon.png (180x180)`);

    // Favicon.ico (32x32) - cho compatibility
    const faviconIcoPath = path.join(publicDir, 'favicon.ico');
    await sharp(logoPath)
      .resize(32, 32, {
        fit: 'contain',
        background: bgColor
      })
      .png()
      .toFile(faviconIcoPath);
    console.log(`✅ Created favicon.ico (32x32)`);

    console.log('\n🎉 All icons created successfully!');
    console.log('\n📋 Created files:');
    console.log('   Favicons: favicon-16x16.png, favicon-32x32.png, favicon-48x48.png, favicon-64x64.png, favicon-96x96.png, favicon-128x128.png');
    console.log('   PWA Icons: icons/icon-192.png, icons/icon-512.png');
    console.log('   Apple: apple-touch-icon.png');
    console.log('   Standard: favicon.ico');
    console.log('\n✨ Icons are ready for favicon and PWA!');

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

