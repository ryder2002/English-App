# 📧 Email Setup với Resend - Quick Start

## Bước 1: Cài đặt package (✅ Đã hoàn thành)

```bash
npm install resend
```

## Bước 2: Lấy API Key từ Resend

1. Truy cập https://resend.com/signup
2. Đăng ký tài khoản (free)
3. Vào Dashboard → API Keys
4. Tạo API key mới
5. Copy API key (CHỈ HIỂN THỊ MỘT LẦN!)

## Bước 3: Cấu hình Environment Variables

Thêm vào file `.env` hoặc `.env.local`:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL="English App <onboarding@resend.dev>"
NEXTAUTH_URL=https://congnhat.online
```

## Bước 4: Test

1. Restart development server:
   ```bash
   npm run dev
   ```

2. Vào http://localhost:3000/forgot-password

3. Nhập email của bạn và submit

4. Kiểm tra email (có thể trong spam nếu dùng onboarding@resend.dev)

## Giới hạn Free Tier

- ✅ **100 emails/ngày**
- ✅ **3,000 emails/tháng**
- ✅ Không giới hạn domains
- ✅ Không giới hạn API keys

## Verify Custom Domain (Optional - cho Production)

Để email không vào spam và có địa chỉ đẹp hơn:

1. Vào Resend Dashboard → Domains
2. Add domain của bạn (ví dụ: congnhat.online)
3. Thêm DNS records vào domain provider:
   - SPF Record
   - DKIM Record  
   - DMARC Record
4. Đợi verify thành công
5. Update `.env`:
   ```env
   RESEND_FROM_EMAIL="English App <noreply@congnhat.online>"
   ```

## Files đã thay đổi

✅ `src/lib/services/email-service.ts` - Email service với Resend
✅ `src/app/api/auth/forgot-password/route.ts` - API sử dụng Resend
✅ `package.json` - Thêm package resend
✅ `.env.example` - Cập nhật config mẫu

## Email Templates

### Reset Password Email
- 🎨 Responsive design
- 🔐 Security warnings
- ⏰ Expiry notice (1 giờ)
- 📱 Mobile-friendly

### Welcome Email (Coming soon)
- 🎉 Chào mừng users mới
- 📚 Hướng dẫn sử dụng
- ✨ Feature highlights

## Troubleshooting

### Email không đến
- Check spam folder
- Verify API key đúng
- Check Resend dashboard logs

### Lỗi 401
- API key sai → Tạo lại

### Email vào spam
- Cần verify custom domain
- Thêm SPF/DKIM records

## Docs chi tiết

📖 Xem file đầy đủ: `docs/resend-setup-guide.md`

## Support

- Resend Docs: https://resend.com/docs
- Resend Dashboard: https://resend.com/overview
- Email issues: support@resend.com
