# Migration Guide - Quiz Streaming Feature

## Tổng quan
Đã thêm chức năng streaming quiz với 3 trạng thái: `pending`, `active`, `ended`.

## Database Migration

### Cần chạy migration để thêm `pending` status vào enum:

```sql
-- Thêm pending vào enum QuizStatus
ALTER TYPE "QuizStatus" ADD VALUE IF NOT EXISTS 'pending';

-- Cập nhật default cho quiz mới tạo
ALTER TABLE "tests" ALTER COLUMN "status" SET DEFAULT 'pending';

-- Optional: Cập nhật các quiz hiện có (nếu muốn)
-- UPDATE "tests" SET "status" = 'pending' WHERE "status" IS NULL AND "ended_at" IS NULL;
```

Hoặc chạy:
```bash
npx prisma migrate dev --name add_pending_status
```

## Tính năng đã thêm

### 1. Admin
- **Nút "Bắt đầu bài kiểm tra"**: Hiển thị khi quiz ở trạng thái `pending`
- **Nút "Kết thúc bài kiểm tra"**: Hiển thị khi quiz ở trạng thái `active`
- **Theo dõi Real-time**: Chỉ hoạt động khi quiz đã bắt đầu (`active` hoặc `ended`)

### 2. Users
- **Trang chờ**: `/quizzes/wait` - Tự động polling mỗi 3 giây
- **Tự động chuyển**: Khi admin bắt đầu quiz, users tự động được chuyển đến trang làm bài
- **Hiển thị pending quizzes**: Trong class detail, users thấy quizzes chờ bắt đầu

### 3. API Endpoints

#### Admin
- `POST /api/admin/quizzes/[id]/start` - Bắt đầu quiz (pending → active)
- `POST /api/admin/quizzes/[id]/end` - Kết thúc quiz (active → ended)
- `GET /api/admin/quizzes/[id]/monitor` - Theo dõi quiz (chỉ khi active/ended)

#### Users
- `POST /api/quizzes/enter-code` - Nhập mã quiz (chỉ cho phép khi active)
- `GET /api/quizzes/[id]/vocabulary` - Lấy vocabulary (chỉ khi active)

## Flow hoạt động

1. **Admin tạo quiz** → status = `pending`
2. **Users nhập mã** → Chuyển đến `/quizzes/wait` nếu pending
3. **Admin nhấn "Bắt đầu"** → status = `active`
4. **Users tự động chuyển** → Từ wait page đến quiz page
5. **Admin có thể "Kết thúc"** → status = `ended`
6. **Users không thể làm bài** → Khi quiz đã ended

## Các file đã thay đổi

### Schema
- `prisma/schema.prisma` - Thêm `pending` vào QuizStatus enum

### API Routes
- `src/app/api/quizzes/enter-code/route.ts` - Check pending status
- `src/app/api/quizzes/[id]/vocabulary/route.ts` - Check pending status
- `src/app/api/admin/quizzes/[id]/start/route.ts` - **MỚI** - Bắt đầu quiz
- `src/app/api/admin/quizzes/[id]/end/route.ts` - Check chỉ end active quizzes
- `src/app/api/admin/quizzes/[id]/monitor/route.ts` - Check pending status
- `src/app/api/classes/my-classes/route.ts` - Lấy tất cả quizzes
- `src/app/api/admin/classes/[id]/route.ts` - Default status là pending

### Pages
- `src/app/admin/tests/[id]/page.tsx` - Thêm nút "Bắt đầu" và xử lý pending
- `src/app/classes/[id]/page.tsx` - Hiển thị pending quizzes
- `src/app/quizzes/enter/page.tsx` - Redirect đến wait page khi pending
- `src/app/quizzes/wait/page.tsx` - **MỚI** - Trang chờ quiz bắt đầu

## Lưu ý

- Migration cần được chạy trước khi sử dụng
- Các quiz cũ sẽ giữ nguyên status hiện tại (hoặc cần update manual)
- Monitor chỉ hoạt động khi quiz đã bắt đầu

