# NEXTAUTH_SECRET mới

Đã tạo NEXTAUTH_SECRET mới:

```
NEXTAUTH_SECRET=YAaQeQBbi4wvcUwt67TlkODcq32HZAspoD3VQmVyP14=
```

## Cách sử dụng:

1. Cập nhật file `.env.local`:
```env
NEXTAUTH_SECRET=YAaQeQBbi4wvcUwt67TlkODcq32HZAspoD3VQmVyP14=
NEXTAUTH_URL=https://cnenglish.io.vn
```

2. **Lưu ý quan trọng**: Khi đổi NEXTAUTH_SECRET:
   - Tất cả users đang đăng nhập sẽ bị logout
   - Cookies cũ sẽ không hợp lệ
   - Users cần đăng nhập lại

3. Restart server sau khi cập nhật:
```bash
npm run dev
```

## Về vấn đề redirect sang congnhat.io.vn:

Có thể do:
1. **DNS redirect** ở hosting provider
2. **Reverse proxy** (nginx, Cloudflare, etc.) đang redirect
3. **Next.js rewrites** trong `next.config.mjs`

Để fix:
- Kiểm tra cấu hình DNS/hosting
- Kiểm tra reverse proxy rules
- Đảm bảo `NEXTAUTH_URL` trong `.env.local` đúng là `https://cnenglish.io.vn`

