# 🔍 Troubleshooting Email Issues

## Email gửi thành công nhưng không thấy trong inbox?

### 1. Kiểm tra Spam/Junk Folder
- Email có thể vào **Spam** hoặc **Junk** folder
- Đặc biệt nếu dùng domain chưa verify (`onboarding@resend.dev` hoặc domain chưa setup SPF/DKIM)
- **Giải pháp**: Check spam folder và mark as "Not Spam"

### 2. Kiểm tra Resend Dashboard
1. Vào https://resend.com/emails
2. Đăng nhập với tài khoản Resend
3. Xem danh sách emails đã gửi
4. Click vào email ID để xem:
   - **Status**: Sent, Delivered, Bounced, Failed
   - **Delivery details**: Thời gian gửi, thời gian nhận
   - **Error messages**: Nếu có lỗi

### 3. Kiểm tra Domain Verification
- Nếu dùng `noreply@congnhat.online` nhưng domain chưa verify → email có thể bị reject
- **Kiểm tra**: 
  - Vào https://resend.com/domains
  - Xem domain `congnhat.online` có status "Verified" không
- **Nếu chưa verify**: 
  - Add domain vào Resend
  - Thêm DNS records (SPF, DKIM, DMARC)
  - Đợi verify (có thể mất vài giờ)

### 4. Kiểm tra Email Address
- Đảm bảo email address đúng: `dinhcongnhat.02@gmail.com`
- Không có typo
- Domain email hợp lệ

### 5. Kiểm tra Rate Limits
- Resend free tier: **100 emails/ngày**
- Nếu đã gửi quá 100 emails → email sẽ bị reject
- **Kiểm tra**: Vào Resend dashboard → Overview → Xem số lượng emails đã gửi hôm nay

### 6. Test với Email khác
- Thử gửi đến email khác (Gmail, Outlook, etc.)
- Nếu email khác nhận được → vấn đề ở email đầu tiên
- Nếu tất cả đều không nhận được → vấn đề ở Resend config

### 7. Kiểm tra Logs
- Xem console logs khi gửi email
- Email ID sẽ được log ra
- Dùng Email ID để tra cứu trên Resend dashboard

## Quick Checklist

- [ ] Check Spam/Junk folder
- [ ] Check Resend dashboard tại https://resend.com/emails
- [ ] Verify domain đã được setup (nếu dùng custom domain)
- [ ] Check rate limits (100 emails/day)
- [ ] Test với email khác
- [ ] Check console logs để lấy Email ID
- [ ] Đợi vài phút (email có thể bị delay)

## Common Issues

### Issue: "Email sent successfully" nhưng không đến
**Nguyên nhân**: Domain chưa verify hoặc vào spam
**Giải pháp**: 
1. Check spam folder
2. Verify domain trên Resend
3. Dùng `onboarding@resend.dev` để test (có thể vào spam)

### Issue: Email bị bounce
**Nguyên nhân**: Email address không hợp lệ hoặc domain reject
**Giải pháp**: 
1. Check email address đúng không
2. Check Resend dashboard để xem bounce reason
3. Test với email khác

### Issue: Email delay
**Nguyên nhân**: Server processing hoặc network delay
**Giải pháp**: 
- Đợi vài phút (thường 1-5 phút)
- Check Resend dashboard để xem delivery status

## Contact Support

Nếu vẫn không giải quyết được:
- Resend Support: https://resend.com/support
- Email: support@resend.com
- Docs: https://resend.com/docs

