# ✅ Hoàn thành: Tính năng lưu lịch sử làm bài Homework

## 🎯 Mục tiêu đã đạt được
- ✅ Mỗi lần học viên làm lại bài sẽ tạo một submission mới (không ghi đè)
- ✅ Mỗi submission có `attemptNumber` để đánh số lần thử (Lần 1, Lần 2, ...)
- ✅ Hiển thị danh sách lịch sử các lần làm bài
- ✅ Hiển thị điểm và thời gian làm bài cho mỗi lần

## 📝 Các thay đổi đã thực hiện

### 1. Database Schema
**File:** `prisma/schema.prisma`
- Thêm trường `attemptNumber` (số lần thử)
- Xóa constraint unique `[homeworkId, userId]`
- Thêm constraint unique mới `[homeworkId, userId, attemptNumber]`
- Thêm index `[homeworkId, userId]` để tối ưu query

### 2. Backend API

#### API Submit (`src/app/api/homework/[homeworkId]/submit/route.ts`)
- **Trước:** Dùng `upsert()` - ghi đè submission cũ
- **Sau:** Dùng `create()` - tạo submission mới với attemptNumber tăng dần
- Tự động tính attemptNumber từ submission mới nhất + 1

#### API Get (`src/app/api/homework/[homeworkId]/route.ts`)
- Trả về tất cả submissions (lịch sử đầy đủ)
- Trả về `currentSubmission` (lần làm hiện tại)
- Tạo submission mới khi user vào xem lần đầu hoặc sau khi retry

#### API Retry (`src/app/api/homework/[homeworkId]/retry/route.ts`)
- **Trước:** Reset submission cũ về `in_progress`
- **Sau:** Tạo submission mới với attemptNumber tăng lên

### 3. Frontend UI

#### Giao diện học viên (`src/app/classes/[id]/homework/[homeworkId]/page.tsx`)
- Hiển thị badge "Lần X" cho lần làm hiện tại
- Nút "📋 Lịch sử (số lần)" để toggle hiển thị lịch sử
- Panel lịch sử với:
  - Số lần thử
  - Thời gian nộp bài
  - Điểm số
  - Thời gian làm bài

## 🔄 Cách sử dụng

### Dừng server và cập nhật database
```powershell
# Dừng server (Ctrl+C)

# Chạy script cập nhật
cd d:\English-App
.\scripts\update-homework-history.ps1

# Hoặc chạy thủ công:
npx prisma generate
npm run dev
```

### Luồng hoạt động mới

1. **Học viên vào xem bài tập lần đầu:**
   - Hệ thống tạo submission với `attemptNumber = 1`, `status = in_progress`

2. **Học viên nộp bài:**
   - Submission hiện tại được cập nhật với đáp án và điểm
   - Status chuyển thành `submitted` hoặc `graded`

3. **Học viên nhấn "Làm lại":**
   - Hệ thống tạo submission MỚI với `attemptNumber = 2`
   - Submission cũ (Lần 1) vẫn được giữ nguyên
   - Học viên có thể xem lịch sử điểm của Lần 1

4. **Xem lịch sử:**
   - Click vào nút "📋 Lịch sử (X)" 
   - Hiển thị danh sách tất cả các lần đã nộp
   - Mỗi lần hiển thị: số thứ tự, thời gian, điểm số, thời gian làm

## 📊 Ví dụ hiển thị

```
Lần 3  [badge hiện tại]
📋 Lịch sử (2)  [click để xem]

┌─────────────────────────────────────────┐
│ 📋 Lịch sử làm bài                      │
├─────────────────────────────────────────┤
│ Lần 2  07/11/2025 14:30    [Điểm: 0.8/1]│
│ Lần 1  07/11/2025 10:15    [Điểm: 0.6/1]│
└─────────────────────────────────────────┘
```

## ⚠️ Lưu ý quan trọng

1. **Migration đã chạy qua `db push`** - Không cần migration file
2. **Lỗi TypeScript sẽ tự động biến mất** sau khi chạy `npx prisma generate`
3. **Dữ liệu cũ:** Tất cả submissions cũ sẽ có `attemptNumber = 1`
4. **Không mất dữ liệu:** Tất cả submission cũ vẫn được giữ nguyên

## 🐛 Troubleshooting

### Lỗi: "attemptNumber does not exist"
**Giải pháp:** Chạy `npx prisma generate` để cập nhật Prisma Client

### Lỗi: "EPERM: operation not permitted"
**Giải pháp:** Dừng server trước khi chạy `npx prisma generate`

### Database không sync
**Giải pháp:** 
```powershell
npx prisma db push
npx prisma generate
```

## 📝 TODO (Nếu muốn mở rộng)
- [ ] Cho phép giáo viên xem tất cả lần làm bài của học viên
- [ ] Export lịch sử điểm ra Excel
- [ ] Biểu đồ tiến bộ qua các lần làm
- [ ] Giới hạn số lần làm lại tối đa
