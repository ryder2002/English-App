# Hướng dẫn thêm tính năng lưu lịch sử làm bài homework

## Bước 1: Chạy migration để cập nhật database

```powershell
# Di chuyển vào thư mục dự án
cd d:\English-App

# Chạy migration
npx prisma migrate dev --name add_homework_history

# Generate Prisma Client mới
npx prisma generate
```

## Bước 2: Khởi động lại server

```powershell
# Dừng server hiện tại (Ctrl+C)
# Khởi động lại
npm run dev
```

## Thay đổi đã thực hiện:

### 1. Database Schema (prisma/schema.prisma)
- ✅ Thêm trường `attemptNumber` vào `HomeworkSubmission`
- ✅ Xóa constraint unique `[homeworkId, userId]`
- ✅ Thêm constraint unique mới `[homeworkId, userId, attemptNumber]`
- ✅ Thêm index cho `[homeworkId, userId]`

### 2. API Changes
- ✅ **Submit API**: Tạo submission mới với attemptNumber tăng dần (không còn upsert)
- ⏳ **Get API**: Cần cập nhật sau khi chạy migration
- ⏳ **Retry API**: Cần cập nhật sau khi chạy migration

### 3. Frontend Changes
- ⏳ Hiển thị danh sách tất cả lần làm bài
- ⏳ Hiển thị lần làm bài hiện tại
- ⏳ Cho phép xem kết quả các lần trước

## Lưu ý:
- Migration sẽ tự động thêm `attemptNumber = 1` cho tất cả submissions hiện có
- Sau khi chạy migration, cần fix các lỗi TypeScript trong API
