# Hướng dẫn tạo các icon từ BG.png

Để icon hiển thị tốt nhất trên desktop PWA, bạn nên tạo các file icon riêng từ BG.png với các kích thước sau:

## Kích thước cần thiết:
- 16x16 (favicon)
- 32x32
- 48x48
- 64x64
- 96x96
- 128x128
- 192x192 (PWA minimum)
- 256x256
- 512x512 (PWA recommended)

## Cách tạo (chọn 1 trong các cách):

### Cách 1: Dùng ImageMagick (nếu đã cài)
```bash
cd public
convert BG.png -resize 16x16 icon-16x16.png
convert BG.png -resize 32x32 icon-32x32.png
convert BG.png -resize 48x48 icon-48x48.png
convert BG.png -resize 64x64 icon-64x64.png
convert BG.png -resize 96x96 icon-96x96.png
convert BG.png -resize 128x128 icon-128x128.png
convert BG.png -resize 192x192 icon-192x192.png
convert BG.png -resize 256x256 icon-256x256.png
convert BG.png -resize 512x512 icon-512x512.png
```

### Cách 2: Dùng online tool
1. Truy cập: https://www.icoconverter.com/ hoặc https://favicon.io/favicon-converter/
2. Upload BG.png
3. Download các icon với kích thước khác nhau
4. Đổi tên và đặt vào thư mục `public/`

### Cách 3: Dùng Photoshop/GIMP
1. Mở BG.png
2. Resize thành từng kích thước (16x16, 32x32, etc.)
3. Export với tên `icon-{size}x{size}.png`
4. Đặt vào thư mục `public/`

**Lưu ý**: Hiện tại manifest.json đang dùng BG.png trực tiếp, trình duyệt sẽ tự động scale. Nhưng để tối ưu performance và chất lượng, nên dùng các file icon riêng sau khi tạo xong.

