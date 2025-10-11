# Migration Guide: Firebase to PostgreSQL

## Hướng dẫn migrate dữ liệu từ Firebase sang PostgreSQL

### Bước 1: Chuẩn bị Firebase Config

1. Mở file `.env.local` trong thư mục root của project
2. Thêm các biến Firebase configuration:

```bash
# Firebase Configuration (thêm vào .env.local)
FIREBASE_API_KEY="your-firebase-api-key"
FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
FIREBASE_APP_ID="your-app-id"

# Migration Settings
DEFAULT_PASSWORD="temp123456"
```

### Bước 2: Tìm Firebase Config

Bạn có thể tìm Firebase config từ:

1. **Firebase Console:**
   - Vào https://console.firebase.google.com
   - Chọn project của bạn
   - Vào Settings > General > Your apps
   - Copy config từ phần "Firebase SDK snippet"

2. **File config cũ:** Kiểm tra trong:
   - `src/lib/firebase.ts` 
   - `firebase.config.js`
   - Hoặc file config cũ khác

### Bước 3: Chạy Migration

```bash
# Cài đặt dependencies nếu chưa có
npm install firebase

# Chạy migration script
npm run migrate:firebase
```

### ⚠️ Quan trọng về Mật khẩu

**Tại sao không thể giữ mật khẩu cũ?**

Firebase Authentication không lưu trữ mật khẩu dưới dạng plaintext mà chỉ lưu hash với thuật toán riêng của Google. Vì vậy chúng ta không thể truy cập hoặc chuyển đổi mật khẩu cũ.

**Giải pháp:**

1. **User đã có tài khoản PostgreSQL:** Migration sẽ giữ nguyên mật khẩu hiện tại, chỉ cập nhật Firebase mapping
2. **User mới:** Sẽ được tạo với mật khẩu tạm thời `temp123456`
3. **Muốn đặt lại mật khẩu:** Sử dụng script reset password (xem bên dưới)

### Bước 4: Đặt lại mật khẩu (nếu cần)

Nếu bạn muốn đặt lại mật khẩu cho user nào đó:

```bash
# Đặt lại mật khẩu cho một user cụ thể
npm run reset-password user@example.com mynewpassword123

# Ví dụ cụ thể
npm run reset-password john@gmail.com mypassword2024
```

### Bước 5: Kiểm tra kết quả

Sau khi migration thành công:

1. **Users:** Tất cả users từ Firebase sẽ được chuyển sang PostgreSQL
   - Email giữ nguyên
   - Password mặc định: `temp123456`
   - Tên được lấy từ Firebase hoặc tạo từ email

2. **Vocabulary:** Tất cả từ vựng sẽ được chuyển sang
   - Liên kết với user thông qua email
   - Folder information được bảo toàn

3. **Folders:** Tự động tạo folders từ vocabulary data

### Bước 6: Đăng nhập

Sau migration, bạn có thể đăng nhập bằng:

**Cho user đã có tài khoản PostgreSQL:**
- **Email:** Email cũ từ Firebase  
- **Password:** Mật khẩu hiện tại của PostgreSQL (không đổi)

**Cho user mới được migrate:**
- **Email:** Email cũ từ Firebase
- **Password:** `temp123456` (hoặc password bạn đã đặt trong DEFAULT_PASSWORD)

**⚠️ Lưu ý:** 
- User đã có tài khoản PostgreSQL sẽ giữ nguyên mật khẩu
- Chỉ user mới từ Firebase mới cần dùng mật khẩu tạm thời
- Đổi password bằng script `reset-password` nếu cần

### Troubleshooting

**Lỗi thường gặp:**

1. **Firebase connection error:**
   - Kiểm tra Firebase config trong .env.local
   - Đảm bảo project ID chính xác
   - Kiểm tra quyền truy cập Firebase

2. **PostgreSQL error:**
   - Đảm bảo database đang chạy
   - Chạy `npm run db:migrate` trước khi migration

3. **Missing fields:**
   - Script sẽ skip các record thiếu email hoặc userId
   - Kiểm tra console log để thấy chi tiết

4. **Password issues:**
   - Nếu không nhớ mật khẩu: dùng `npm run reset-password email newpassword`
   - Nếu user không đăng nhập được: kiểm tra email có đúng không
   - Reset về temp password: `npm run reset-password email temp123456`

**Rollback:**
Nếu có vấn đề, bạn có thể xóa data và migration lại:

```bash
# Reset database
npx prisma migrate reset

# Chạy lại migration
npm run migrate:firebase
```

### Schema Mapping

**Firebase → PostgreSQL:**

```
Firebase users collection:
- email → email
- name/displayName → name  
- uid → firebaseUid (for tracking)
- createdAt → createdAt

Firebase vocabulary collection:
- word → word
- meaning → vietnameseTranslation
- folder → folder
- userId (Firebase UID) → userId (PostgreSQL ID)
- language → language
- partOfSpeech → partOfSpeech
- ipa → ipa
- pinyin → pinyin
- audioSrc → audioSrc
```

### Sau Migration

1. **Test login:** Đăng nhập bằng email cũ và password `temp123456`
2. **Đổi password:** Vào Settings để đổi password mới
3. **Kiểm tra data:** Xem folders và vocabulary đã được migrate đúng chưa
4. **Backup:** Tạo backup PostgreSQL để an toàn

Chúc bạn migration thành công! 🎉
