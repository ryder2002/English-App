# 🚀 Quick Start: Gửi Email Reset Password với Resend

## Chỉ 3 bước để bắt đầu!

### Bước 1: Lấy API Key (2 phút) 🔑

1. Vào https://resend.com/signup
2. Đăng ký với email/GitHub (FREE)
3. Vào Dashboard → **API Keys**
4. Click **"Create API Key"**
5. Copy API key (bắt đầu với `re_...`)

### Bước 2: Cấu hình (.env) 📝

Tạo file `.env.local` hoặc cập nhật `.env`:

```bash
RESEND_API_KEY=re_paste_your_key_here
RESEND_FROM_EMAIL="English App <onboarding@resend.dev>"
```

### Bước 3: Test 🧪

```bash
# Khởi động server
npm run dev

# Hoặc test bằng script
node scripts/test-resend-email.js
```

Vào http://localhost:3000/forgot-password và thử!

---

## ✅ Xong rồi!

Email sẽ được gửi tới hộp thư của bạn (có thể trong spam nếu dùng `onboarding@resend.dev`).

## 🎁 Bonus: Custom Domain (Production)

Để email không vào spam:

1. Vào Resend → **Domains** → **Add Domain**
2. Nhập domain: `congnhat.online`
3. Thêm DNS records (copy từ Resend):
   - SPF: `v=spf1 include:_spf.resend.com ~all`
   - DKIM: (copy từ dashboard)
   - DMARC: `v=DMARC1; p=none;`
4. Đợi verify (vài giờ)
5. Update `.env`:
   ```
   RESEND_FROM_EMAIL="English App <noreply@congnhat.online>"
   ```

## 📊 Giới hạn FREE

- 100 emails/ngày
- 3,000 emails/tháng
- Không giới hạn domains

## 💡 Tips

### Email vào spam?
→ Cần verify custom domain với SPF/DKIM

### Lỗi 401?
→ Check API key trong .env

### Email không đến?
→ Check spam folder & Resend logs

## 📚 Docs đầy đủ

- Chi tiết: `docs/resend-setup-guide.md`
- Summary: `RESEND_MIGRATION_SUMMARY.md`

---

**Cần help?** → Check console logs hoặc Resend dashboard
