# 🔄 Hướng dẫn Migration từ Firebase sang PostgreSQL

## Bước 1: Cài đặt PostgreSQL

### Windows:
1. Tải PostgreSQL từ: https://www.postgresql.org/download/windows/
2. Cài đặt và ghi nhớ password cho user `postgres`
3. Thêm PostgreSQL vào PATH

### Kiểm tra cài đặt:
```bash
psql --version
```

## Bước 2: Tạo Database

```bash
# Tạo database
createdb -U postgres english_app_db

# Hoặc sử dụng psql
psql -U postgres
CREATE DATABASE english_app_db;
\q
```

## Bước 3: Cấu hình Database URL

Cập nhật file `.env.local`:

```env
# Thay thế với thông tin PostgreSQL của bạn
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/english_app_db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Bước 4: Chạy Migration

```bash
# Tạo và chạy Prisma migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

## Bước 5: Migration dữ liệu từ Firebase (Tùy chọn)

⚠️ **Quan trọng**: Backup dữ liệu Firebase trước khi migration!

```bash
# Chạy script migration
npm run migrate:firebase
```

## Bước 6: Chuyển đổi code để sử dụng PostgreSQL

### 6.1 Thay thế Auth Context:

Trong `src/app/layout.tsx`, thay thế:
```tsx
// Cũ
import { AuthProvider } from "@/contexts/auth-context";

// Mới  
import { AuthProvider } from "@/contexts/auth-context-postgres";
```

### 6.2 Thay thế Vocabulary Service:

Trong các file component, thay thế:
```tsx
// Cũ
import { getVocabulary, addVocabularyItem } from "@/lib/services/vocabulary-service";

// Mới
import { getVocabulary, addVocabularyItem } from "@/lib/services/vocabulary-service-postgres";
```

### 6.3 Thay thế Folder Service:

```tsx
// Cũ
import { getFolders, addFolder } from "@/lib/services/folder-service";

// Mới
import { getFolders, addFolder } from "@/lib/services/folder-service-postgres";
```

### 6.4 Cập nhật User ID type:

Thay đổi từ `string` sang `number` trong các function calls:
```tsx
// Cũ
const userId = user?.uid; // string

// Mới
const userId = user?.id; // number
```

## Bước 7: Test Application

```bash
# Chạy app
npm run dev

# Test các chức năng:
# 1. Đăng ký tài khoản mới
# 2. Đăng nhập
# 3. Thêm vocabulary
# 4. Tạo folder
# 5. Xóa vocabulary/folder
```

## Bước 8: Monitoring & Debug

```bash
# Xem database trong Prisma Studio
npm run db:studio

# Check logs in terminal khi chạy app
# Kiểm tra Network tab trong browser DevTools
```

## Rollback Plan (Nếu cần)

Nếu có vấn đề, bạn có thể rollback về Firebase:

1. Restore backup files:
   - `src/contexts/auth-context.tsx`
   - `src/lib/services/vocabulary-service.ts`
   - `src/lib/services/folder-service.ts`

2. Cập nhật imports trong các component

3. Remove PostgreSQL dependencies (optional):
```bash
npm uninstall @prisma/client prisma next-auth bcryptjs jsonwebtoken
npm uninstall -D @types/bcryptjs @types/jsonwebtoken
```

## Lợi ích sau Migration

### 1. Performance
- Truy vấn SQL nhanh hơn NoSQL cho complex queries
- Indexing tốt hơn
- Caching hiệu quả hơn

### 2. Cost
- Không có per-operation cost như Firebase
- Predictable pricing
- Có thể host local hoặc cloud

### 3. Data Integrity
- ACID transactions
- Foreign key constraints
- Better data validation

### 4. Flexibility
- Standard SQL queries
- Better integration với BI tools
- Easier data analysis

## Troubleshooting

### Lỗi thường gặp:

1. **Connection refused**
   - Kiểm tra PostgreSQL service đang chạy
   - Verify DATABASE_URL format

2. **Migration errors**
   - Xóa folder `prisma/migrations` và chạy lại
   - Kiểm tra database permissions

3. **Authentication errors**
   - Verify NEXTAUTH_SECRET được set
   - Check API routes đang hoạt động

### Liên hệ hỗ trợ:
- Tạo GitHub issue
- Check Prisma documentation
- PostgreSQL community forums
