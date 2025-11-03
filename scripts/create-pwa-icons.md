# Hướng dẫn tạo PWA Icons

Để tạo các file icon cho PWA, bạn cần tạo 2 file từ Logo.png:

1. **icon-192x192.png** - Kích thước 192x192 pixels
2. **icon-512x512.png** - Kích thước 512x512 pixels  
3. **apple-touch-icon.png** - Kích thước 180x180 pixels (cho iOS)

Bạn có thể:
- Dùng công cụ online như: https://www.favicon-generator.org/
- Hoặc dùng image editor (Photoshop, GIMP, etc.) để resize Logo.png
- Hoặc dùng command line với ImageMagick:
  ```bash
  convert Logo.png -resize 192x192 icon-192x192.png
  convert Logo.png -resize 512x512 icon-512x512.png
  convert Logo.png -resize 180x180 apple-touch-icon.png
  ```

Đặt tất cả các file này vào thư mục `public/`

