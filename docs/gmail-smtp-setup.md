# Hướng dẫn Setup Gmail SMTP cho English App

## 🔐 Bước 1: Bật 2-Factor Authentication

1. Vào [Google Account Settings](https://myaccount.google.com/)
2. Chọn **Security** > **2-Step Verification**
3. Bật 2FA nếu chưa có

## 🔑 Bước 2: Tạo App Password

1. Vào [Google Account](https://myaccount.google.com/) > **Security**
2. Tìm **App passwords** (nếu không thấy, bật 2FA trước)
3. Chọn **Mail** và thiết bị **Windows Computer**
4. Copy **16-character password** (ví dụ: abcd efgh ijkl mnop)

## ⚙️ Bước 3: Cấu hình .env

Copy từ `.env.gmail` và cập nhật vào file `.env` chính:

```env
EMAIL_SERVICE_ENABLED="true"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="dinhcongnhat.02@gmail.com"
EMAIL_PASS="abcd efgh ijkl mnop"  # App Password (16 ký tự)
EMAIL_FROM="dinhcongnhat.02@gmail.com"
```

## 🧪 Bước 4: Test Email

```bash
npm run test:email
```

## ✅ Bước 5: Test Forgot Password

1. Restart dev server: `npm run dev`
2. Vào `http://localhost:3001/forgot-password`
3. Nhập email: `dinhcongnhat.02@gmail.com`
4. Kiểm tra email để nhận link reset

## ❌ Troubleshooting

### Lỗi "Authentication failed"
- Kiểm tra email và app password đúng
- Đảm bảo 2FA đã bật
- Sử dụng App Password, không dùng mật khẩu Gmail thường

### Lỗi "Connection timeout"
- Kiểm tra kết nối internet
- Thử port 465 với secure: true

### Email không gửi được
- Kiểm tra spam folder
- Đảm bảo EMAIL_SERVICE_ENABLED="true"
