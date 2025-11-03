# Giải thích về Logo.png và Favicon

## 1. `href="/Logo.png"` trong HTML `<head>` là gì?

Trong file `src/app/layout.tsx`, bạn thấy:
```html
<link rel="icon" href="/Logo.png?v=2" type="image/png" />
<link rel="shortcut icon" href="/Logo.png?v=2" type="image/png" />
```

### Favicon là gì?
- **Favicon** = Favorite Icon = Icon nhỏ hiển thị trên **tab trình duyệt**
- Khi bạn mở website, icon nhỏ xuất hiện ở góc trái của tab
- Icon này cũng hiển thị trong bookmarks, history, và address bar

### Tại sao dùng Logo.png?
- `Logo.png` trong thư mục `public/` được dùng làm favicon
- Khi trình duyệt load website, nó sẽ tự động tải file này để hiển thị trên tab

### `?v=2` là gì?
- Đây là **cache busting** - buộc trình duyệt tải lại file mới
- Nếu thay đổi logo nhưng trình duyệt vẫn hiển thị logo cũ, đổi `?v=2` thành `?v=3`

## 2. Logo trên Website (CNLogo Component)

Logo hiển thị **trong nội dung website** (không phải favicon) được quản lý bởi component `CNLogo`:
- File: `src/components/cn-logo.tsx`
- Component này hiển thị logo + text "CN English" ở:
  - Sidebar (desktop)
  - Header mobile
  - Login page
  - Các trang khác dùng AppShell

## 3. Sự khác biệt

| Loại | Favicon (`href="/Logo.png"`) | Logo Component (`<CNLogo />`) |
|------|------------------------------|-------------------------------|
| **Hiển thị ở đâu** | Tab trình duyệt, bookmarks | Nội dung trong website |
| **Kích thước** | Rất nhỏ (16x16, 32x32) | Lớn hơn (có thể điều chỉnh) |
| **File** | `/Logo.png` trong `public/` | `/Logo.png` trong `public/` |
| **Cấu hình** | Trong `<head>` của layout.tsx | Component React |

## 4. Tại sao logo không hiện trên tab?

Có thể do:
1. **Browser cache** - Cần hard refresh: `Ctrl+Shift+R`
2. **File không tồn tại** - Kiểm tra `public/Logo.png` có tồn tại không
3. **Cache busting** - Thử đổi `?v=2` thành `?v=3` trong layout.tsx

## 5. PWA Icon (Khi tải app về desktop)

Icon khi tải PWA về desktop được cấu hình trong `public/manifest.json`:
- Sử dụng `Logo.png` với sizes 192x192 và 512x512
- Hiển thị khi user cài đặt app như một ứng dụng desktop

