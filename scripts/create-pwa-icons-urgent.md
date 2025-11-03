# Tạo PWA Icons Đúng Kích Thước

## Vấn đề:
- Logo.png quá lớn (2125x1908px)
- Trình duyệt không thể hiển thị đúng khi resize
- Khi cài PWA chỉ thấy chữ "C" thay vì logo

## Giải pháp nhanh:

### Cách 1: Dùng công cụ online (NHANH NHẤT)

1. Truy cập: https://squoosh.app/
2. Upload file `public/Logo.png`
3. Resize thành các sizes sau và tải về:
   - 192x192px → Lưu thành `icon-192.png`
   - 512x512px → Lưu thành `icon-512.png`
4. Lưu vào thư mục `public/icons/`
5. Cập nhật manifest.json để dùng các icon này

### Cách 2: Dùng Photoshop/GIMP

1. Mở Logo.png
2. Resize Image → Đặt kích thước chính xác
3. Export as PNG
4. Lưu với tên đúng kích thước

### Cách 3: Dùng Node.js Sharp (Nếu có)

```bash
npm install sharp --save-dev
node scripts/resize-icons.js
```

## Quan trọng:
- Icon phải đúng kích thước (192x192 và 512x512)
- Icon nên là hình vuông
- Logo nên có padding xung quanh (safe area)
- Background nên là màu đơn sắc hoặc transparent

