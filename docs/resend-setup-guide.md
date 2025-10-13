# Hướng dẫn cấu hình Resend để gửi Email

## 1. Đăng ký tài khoản Resend

1. Truy cập https://resend.com/
2. Click "Get Started" hoặc "Sign Up"
3. Đăng ký với email/GitHub
4. Xác nhận email của bạn

## 2. Lấy API Key

1. Sau khi đăng nhập, vào dashboard
2. Click vào "API Keys" trong sidebar
3. Click "Create API Key"
4. Đặt tên cho API key (ví dụ: "English App Production")
5. Chọn permission: "Sending access"
6. Click "Create"
7. **QUAN TRỌNG**: Copy API key ngay lập tức (chỉ hiển thị 1 lần)

## 3. Verify Domain (Quan trọng cho Production)

### Option 1: Sử dụng email mặc định (Development)
- Resend cung cấp email test: `onboarding@resend.dev`
- Có thể gửi tới bất kỳ email nào
- **Lưu ý**: Email có thể vào spam

### Option 2: Verify domain riêng (Khuyến nghị cho Production)

1. Vào "Domains" trong dashboard Resend
2. Click "Add Domain"
3. Nhập domain của bạn (ví dụ: `congnhat.online`)
4. Resend sẽ cung cấp DNS records cần thêm:
   - **SPF Record**: TXT record cho authentication
   - **DKIM Record**: TXT record cho signing
   - **DMARC Record**: TXT record cho policy

5. Thêm các DNS records vào domain provider (ví dụ Cloudflare, GoDaddy):
   
   ```
   Type: TXT
   Name: @ (hoặc domain của bạn)
   Value: v=spf1 include:_spf.resend.com ~all
   
   Type: TXT  
   Name: resend._domainkey
   Value: [giá trị DKIM từ Resend]
   
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:your-email@domain.com
   ```

6. Đợi DNS propagate (có thể mất 24-48 giờ)
7. Click "Verify" trong Resend dashboard
8. Sau khi verify thành công, bạn có thể gửi email từ `noreply@congnhat.online` hoặc bất kỳ địa chỉ nào trên domain

## 4. Cấu hình Environment Variables

Tạo hoặc cập nhật file `.env` hoặc `.env.local`:

```env
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email gửi đi (sau khi verify domain)
RESEND_FROM_EMAIL="English App <noreply@congnhat.online>"

# Hoặc dùng email mặc định cho development
# RESEND_FROM_EMAIL="English App <onboarding@resend.dev>"

# App URL
NEXTAUTH_URL=https://congnhat.online
```

## 5. Test gửi email

### Cách 1: Qua UI
1. Đăng nhập vào app
2. Vào trang "Quên mật khẩu"  
3. Nhập email của bạn
4. Kiểm tra hộp thư đến (có thể trong spam)

### Cách 2: Test với API trực tiếp

Tạo file `test-email.js`:

```javascript
const { Resend } = require('resend');

const resend = new Resend('re_your_api_key_here');

async function testEmail() {
  try {
    const data = await resend.emails.send({
      from: 'English App <onboarding@resend.dev>',
      to: ['your-email@gmail.com'],
      subject: 'Test Email from Resend',
      html: '<h1>Hello World!</h1><p>This is a test email.</p>'
    });

    console.log('Email sent successfully:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmail();
```

Chạy: `node test-email.js`

## 6. Giới hạn Free Tier

Resend Free tier bao gồm:
- **100 emails/ngày**
- **3,000 emails/tháng**
- Không giới hạn verified domains
- Không giới hạn API keys

Nếu cần nhiều hơn, upgrade lên Pro plan ($20/tháng):
- 50,000 emails/tháng
- $1 per 1,000 emails thêm

## 7. Best Practices

### Email Template
- ✅ Sử dụng responsive HTML
- ✅ Bao gồm plain text version
- ✅ Thêm unsubscribe link
- ✅ Tránh spam words

### Security
- ✅ Không commit API key vào Git
- ✅ Sử dụng environment variables
- ✅ Rotate API keys định kỳ
- ✅ Set proper CORS headers

### Deliverability
- ✅ Verify domain với SPF, DKIM, DMARC
- ✅ Warm up IP (gửi từ từ lúc đầu)
- ✅ Monitor bounce rates
- ✅ Xử lý unsubscribes

## 8. Troubleshooting

### Email không đến
- ✅ Kiểm tra spam folder
- ✅ Verify API key đúng
- ✅ Check Resend dashboard logs
- ✅ Verify domain đã được setup

### Lỗi 401 Unauthorized
- API key sai hoặc đã expire
- Tạo API key mới

### Lỗi 429 Rate Limit
- Đã vượt quá giới hạn free tier
- Đợi 24h hoặc upgrade plan

### Email vào spam
- Chưa verify domain
- Thiếu SPF/DKIM records  
- Nội dung email có spam keywords
- IP reputation thấp

## 9. Monitoring

Resend Dashboard cung cấp:
- Email delivery status
- Open rates (nếu enable tracking)
- Click rates  
- Bounce rates
- Spam complaints

Check logs thường xuyên để đảm bảo emails được gửi thành công.

## 10. Alternative Email Providers

Nếu Resend không phù hợp, có thể thử:
- **SendGrid**: Free 100 emails/day
- **Mailgun**: Free 5,000 emails/month  
- **Amazon SES**: $0.10 per 1,000 emails
- **Postmark**: $15/month for 10,000 emails

Nhưng Resend là lựa chọn tốt nhất cho developers với:
- API đơn giản
- Docs rõ ràng
- Free tier hợp lý
- Modern developer experience
