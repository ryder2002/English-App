# Fix Admin Speaking Submission History

## Vấn đề ban đầu
- Trang xem lịch sử làm bài phía admin không lấy được thông tin bài làm của học viên
- Không hiển thị đúng thời gian nộp bài
- Mỗi lần học viên làm bài tạo lịch sử mới nhưng không hiển thị đúng

## Nguyên nhân

### 1. **Sai Table Query**
- API admin đang query `homeworkSubmission` table
- Nhưng speaking submissions được lưu trong `speakingSubmission` table
- Kết quả: Không tìm thấy dữ liệu → "Submission not found"

### 2. **Thiếu xử lý Speaking Type**
Các API sau đều bị lỗi tương tự:
- `/api/admin/homework/[id]/submissions/[submissionId]` (GET, DELETE)
- `/api/admin/submissions` (GET - danh sách)
- `/api/admin/submissions` (POST - chi tiết)

## Các file đã fix

### 1. `/api/admin/homework/[id]/submissions/[submissionId]/route.ts`

**GET Endpoint - Xem chi tiết submission:**
```typescript
// Before: Chỉ query homeworkSubmission
const submission = await prisma.homeworkSubmission.findUnique(...)

// After: Check homework type và query đúng table
const homework = await prisma.homework.findUnique({
  where: { id: homeworkId },
  select: { type: true }
});

if (homework.type === 'speaking') {
  const speakingSubmission = await prisma.speakingSubmission.findUnique(...)
  // Return speaking data với submittedAt, attemptNumber, voiceAnalysis
}
```

**DELETE Endpoint - Xóa submission:**
```typescript
// Before: Chỉ xóa từ homeworkSubmission
await prisma.homeworkSubmission.delete(...)

// After: Check type và xóa từ đúng table
if (homework.type === 'speaking') {
  await prisma.speakingSubmission.delete(...)
} else {
  await prisma.homeworkSubmission.delete(...)
}
```

### 2. `/api/admin/submissions/route.ts`

**GET Endpoint - Danh sách submissions:**
```typescript
// Before: Query homeworkSubmission với filter type='speaking'
const submissions = await prisma.homeworkSubmission.findMany({
  where: { homework: { type: 'speaking' } }
})

// After: Query trực tiếp speakingSubmission
const submissions = await prisma.speakingSubmission.findMany({
  where,
  include: {
    user: { select: { id, name, email } },
    homework: { select: { id, title, speakingText } }
  },
  orderBy: { submittedAt: 'desc' }
})

// Return data với:
// - submittedAt: Thời gian nộp chính xác
// - attemptNumber: Lần nộp thứ mấy
// - voiceAnalysis: Kết quả đánh giá AI
// - transcribedText: Văn bản đã chuyển đổi
// - score: Điểm số
```

**POST Endpoint - Chi tiết submission:**
```typescript
// Before: Query homeworkSubmission và parse từ answers field
const submission = await prisma.homeworkSubmission.findUnique(...)
analysisDetails = submission.answers

// After: Query speakingSubmission và parse từ voiceAnalysis field
const submission = await prisma.speakingSubmission.findUnique(...)
analysisDetails = submission.voiceAnalysis

// Return detailed analysis:
// - overallScore, accuracyScore, fluencyScore, etc.
// - words: Chi tiết từng từ
// - feedback: Nhận xét AI
```

## Dữ liệu trả về hiện tại

### Danh sách submissions (GET /api/admin/submissions)
```json
{
  "success": true,
  "submissions": [
    {
      "id": 5,
      "user": {
        "id": 1,
        "name": "Đinh Công Nhật",
        "email": "dinhcongnhat.work@gmail.com"
      },
      "homework": {
        "id": 4,
        "title": "TEST",
        "speakingText": "It is difficult to imagine..."
      },
      "transcribedText": "It is difficult to imagine...",
      "score": 0.75,
      "audioUrl": "https://r2-url.com/audio.webm",
      "voiceAnalysis": { /* AI assessment */ },
      "submittedAt": "2025-11-13T08:30:15.000Z", // ✅ Thời gian nộp chính xác
      "attemptNumber": 1, // ✅ Lần nộp thứ 1
      "status": "graded",
      "method": "ai-enhanced"
    }
  ],
  "pagination": { /* ... */ }
}
```

### Chi tiết submission (POST /api/admin/submissions)
```json
{
  "success": true,
  "submission": {
    "id": 5,
    "user": { /* ... */ },
    "homework": { /* ... */ },
    "transcribedText": "...",
    "score": 0.75,
    "audioUrl": "...",
    "submittedAt": "2025-11-13T08:30:15.000Z", // ✅ Chính xác
    "attemptNumber": 1, // ✅ Hiển thị lần thử
    "status": "graded",
    "analysis": {
      "overallScore": 75,
      "accuracyScore": 80,
      "fluencyScore": 70,
      "completenessScore": 75,
      "prosodyScore": 70,
      "feedback": "Good pronunciation overall...",
      "words": [
        { "word": "difficult", "accuracyScore": 85, "errorType": "None" },
        { "word": "imagine", "accuracyScore": 90, "errorType": "None" }
      ]
    },
    "statistics": {
      "wordsSpoken": 123,
      "originalWords": 123,
      "completionRate": 100
    }
  }
}
```

## Lợi ích sau khi fix

### ✅ Hiển thị đúng dữ liệu
- Lấy được tất cả speaking submissions
- Hiển thị đầy đủ thông tin học viên
- Có audio URL để nghe lại

### ✅ Thời gian chính xác
- `submittedAt`: Thời điểm nộp bài chính xác (không phải startedAt)
- Hiển thị đúng ngày giờ theo định dạng Việt Nam

### ✅ Lịch sử đầy đủ
- `attemptNumber`: Biết được lần nộp thứ mấy
- Mỗi lần làm lại tạo record mới với attemptNumber khác nhau
- Giữ được toàn bộ lịch sử (không ghi đè)

### ✅ Thông tin AI chi tiết
- Điểm số từng khía cạnh (accuracy, fluency, completeness, prosody)
- Đánh giá từng từ
- Feedback từ AI
- Văn bản đã chuyển đổi

## Testing

### 1. Xem danh sách submissions
```
GET /api/admin/submissions?homeworkId=4
```
- ✅ Hiển thị tất cả lần nộp
- ✅ Mỗi lần có attemptNumber khác nhau
- ✅ submittedAt chính xác

### 2. Xem chi tiết submission
```
GET /api/admin/homework/4/submissions/5
```
- ✅ Lấy được full data
- ✅ Có audio URL
- ✅ Có AI analysis
- ✅ Có submittedAt

### 3. Xóa submission
```
DELETE /api/admin/homework/4/submissions/5
```
- ✅ Xóa được từ speakingSubmission table
- ✅ Không ảnh hưởng regular homework submissions

## Checklist

- [x] Fix API GET submission detail
- [x] Fix API DELETE submission
- [x] Fix API GET submissions list
- [x] Fix API POST submission detail
- [x] Verify data structure
- [x] Test on admin panel
- [x] Check submission history
- [x] Verify time display
- [x] Verify attempt numbers
- [x] Test delete function

## Notes

- Speaking submissions và regular homework submissions nằm ở 2 table khác nhau
- Cần check `homework.type` trước khi query
- Field names khác nhau:
  - Regular: `answer`, `answers`, `audioData`
  - Speaking: `transcribedText`, `voiceAnalysis`, `audioUrl`
- Speaking không có `startedAt`, chỉ có `submittedAt`
- Speaking có `attemptNumber` để track lần thử
