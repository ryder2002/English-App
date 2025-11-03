# 🔧 Sửa Lỗi PWA Icon (Chỉ thấy chữ "C")

## Vấn đề:
Khi cài đặt PWA, chỉ thấy chữ "C" thay vì logo vì Logo.png quá lớn (2125x1908px).

## ✅ Giải pháp NHANH NHẤT (5 phút):

### Bước 1: Resize Logo.png

**Cách 1: Dùng Squoosh (Khuyên dùng)**
1. Truy cập: **https://squoosh.app/**
2. Click "Select an image" → Chọn `public/Logo.png`
3. Ở panel bên phải, chọn "Resize"
4. **Tạo icon 192x192:**
   - Width: `192`
   - Height: `192`
   - ✅ Tick "Maintain aspect ratio" (nếu muốn giữ tỷ lệ)
   - Click "Download" → Lưu thành `icon-192.png`
5. **Tạo icon 512x512:**
   - Upload lại Logo.png
   - Width: `512`, Height: `512`
   - Download → Lưu thành `icon-512.png`

**Cách 2: Dùng Paint (Windows)**
1. Mở `public/Logo.png` trong Paint
2. Chọn "Resize"
3. Đặt Width: 192, Height: 192
4. "Save as" → `icon-192.png` vào thư mục `public/icons/`
5. Làm tương tự cho 512x512

### Bước 2: Đặt icon vào đúng thư mục

Đặt 2 files vào: `public/icons/`
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

### Bước 3: Clear cache và test

1. **Clear PWA cache:**
   - Chrome: `chrome://serviceworker-internals/` → Unregister
   - Hoặc xóa app đã cài và cài lại

2. **Restart server:**
   ```bash
   npm run build
   npm start
   ```

3. **Test lại:**
   - Mở: `https://cnenglish.io.vn`
   - Click "Cài đặt" hoặc "Install"
   - Icon logo sẽ hiển thị thay vì chữ "C"

## ⚠️ Lưu ý:

- Icon **PHẢI** đúng kích thước (192x192 và 512x512)
- Icon nên là hình **vuông** (aspect ratio 1:1)
- Nếu logo không vuông, thêm background màu `#0A0F1F` để fill
- Đảm bảo logo có padding (safe area) để không bị cắt khi maskable

## 🎯 Kiểm tra:

Sau khi đặt icon, kiểm tra:
- `https://cnenglish.io.vn/icons/icon-192.png` phải load được
- `https://cnenglish.io.vn/icons/icon-512.png` phải load được
- `https://cnenglish.io.vn/manifest.json` phải reference đúng paths

---

**Sau khi làm xong, PWA icon sẽ hiển thị logo thay vì chữ "C"!** ✅

