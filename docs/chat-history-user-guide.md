# 🎉 Chat History System - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Hệ thống Chat History đã được tích hợp hoàn toàn vào chatbot, cho phép bạn:
- ✅ Lưu trữ tất cả cuộc trò chuyện với AI
- ✅ Xem lại lịch sử bất cứ lúc nào
- ✅ Tạo nhiều cuộc trò chuyện riêng biệt
- ✅ Đổi tên và quản lý conversations
- ✅ Tìm kiếm nhanh theo tên
- ✅ Sử dụng tốt trên cả desktop và mobile

---

## 🚀 Bắt Đầu Nhanh

### Bước 1: Apply Database Changes

```bash
# Chạy lệnh sau trong terminal:
npx prisma db push
npx prisma generate

# Hoặc nếu muốn tạo migration:
npx prisma migrate dev --name add_chat_history
```

### Bước 2: Restart Development Server

```bash
# Stop server (Ctrl + C) và restart:
npm run dev
```

### Bước 3: Truy Cập Chatbot

- Mở browser: `http://localhost:3000/chatbot`
- Login vào account của bạn
- Bạn sẽ thấy sidebar bên trái với lịch sử chat!

---

## 💡 Hướng Dẫn Sử Dụng

### 📱 Trên Desktop

#### 1. Sidebar luôn hiển thị bên trái
- Màu xanh gradient, width 320px
- Hiển thị tất cả conversations

#### 2. Tạo Cuộc Trò Chuyện Mới
```
👉 Click nút "Cuộc trò chuyện mới" (màu xanh ở top sidebar)
   → System tự động tạo conversation
   → Hiển thị welcome message từ AI
   → Bắt đầu chat!
```

#### 3. Xem Lại Lịch Sử
```
👉 Click vào bất kỳ conversation nào trong list
   → Toàn bộ messages sẽ load lại
   → Tiếp tục chat từ đó
```

#### 4. Tìm Kiếm
```
👉 Gõ vào ô search (icon 🔍)
   → Filter real-time theo title
   → Không cần nhấn Enter
```

#### 5. Đổi Tên Conversation
```
👉 Click icon ✏️ (Edit) bên phải conversation
   → Input field xuất hiện
   → Gõ tên mới
   → Nhấn Enter hoặc click "Lưu"
   → ESC hoặc "Hủy" để cancel
```

#### 6. Xóa Conversation
```
👉 Click icon 🗑️ (Trash) màu đỏ
   → Confirm dialog xuất hiện
   → Click OK để xóa
   → Conversation và TẤT CẢ messages sẽ bị xóa vĩnh viễn!
```

---

### 📱 Trên Mobile

#### 1. Mở Sidebar
```
👉 Click icon ☰ (Hamburger menu) ở góc trên trái
   → Sidebar slide từ trái sang
   → Black backdrop overlay phía sau
```

#### 2. Đóng Sidebar
```
👉 Click vào backdrop (vùng tối)
   HOẶC
👉 Click icon ← (Back) trong sidebar
   HOẶC
👉 Click vào một conversation (tự động đóng)
```

#### 3. Các tính năng khác giống Desktop
- Tạo mới, đổi tên, xóa, tìm kiếm đều hoạt động giống nhau
- UI được optimize cho touch (buttons lớn hơn, spacing tốt hơn)

---

## 🎨 Giao Diện

### Sidebar Components

#### 1. **Header**
- Title: "Lịch sử chat" với icon 💬
- Nút "Cuộc trò chuyện mới" (gradient blue)
- Search box với icon 🔍

#### 2. **Conversation Card** (Chưa chọn)
- Background: Trắng
- Border: 2px transparent → 2px blue khi hover
- Hover effect: Màu xanh nhạt (blue-50)

#### 3. **Conversation Card** (Đang chọn)
- Background: Gradient blue → indigo
- Text color: Trắng
- Border: 2px blue-600
- Shadow: Large shadow-lg

#### 4. **Card Content**
```
📌 Title (font-semibold, line-clamp-1)
💬 Last message preview (60 characters, line-clamp-1)
⏱️ "5 phút trước" (relative time, Vietnamese locale)
🔢 "12 tin nhắn" (message count)
```

#### 5. **Action Buttons**
- ✏️ Edit (blue hover)
- 🗑️ Delete (red hover)
- Size: 28x28px (7x7 in Tailwind)

#### 6. **Footer**
- "X cuộc trò chuyện" (total count)
- Text nhỏ, center aligned

---

## 🔧 Technical Details

### Database Schema

```sql
-- chat_conversations table
CREATE TABLE chat_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- chat_messages table
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_user ON chat_conversations(user_id);
CREATE INDEX idx_messages_conversation ON chat_messages(conversation_id);
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations` | List all conversations |
| POST | `/api/chat/conversations` | Create new conversation |
| GET | `/api/chat/conversations/:id` | Get conversation with messages |
| PUT | `/api/chat/conversations/:id` | Rename conversation |
| DELETE | `/api/chat/conversations/:id` | Delete conversation |
| GET | `/api/chat/conversations/:id/messages` | Get all messages |
| POST | `/api/chat/conversations/:id/messages` | Add new message |

### Authentication

Tất cả API endpoints require authentication:
```typescript
Headers: {
  'Authorization': 'Bearer YOUR_TOKEN'
}
```

Token được lấy từ cookie `token` trong browser.

---

## 🐛 Troubleshooting

### ❌ Lỗi: "chatConversation does not exist"

**Nguyên nhân:** Prisma client chưa generate với model mới

**Giải pháp:**
```bash
npx prisma generate
# Restart VSCode TypeScript server: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

### ❌ Sidebar không hiện trên mobile

**Nguyên nhân:** State `isMobile` hoặc `isSidebarOpen` không đúng

**Kiểm tra:**
1. Mở DevTools console
2. Resize window < 768px
3. Check trong React DevTools: `isMobile` phải là `true`
4. Click hamburger menu: `isSidebarOpen` phải thành `true`

---

### ❌ Messages không save vào database

**Nguyên nhân:** Token authentication lỗi hoặc `currentConversationId` null

**Kiểm tra:**
1. Mở DevTools → Application → Cookies
2. Verify có cookie `token`
3. Mở Network tab, xem API response
4. Check console errors

**Giải pháp:**
- Clear cookies và login lại
- Tạo conversation mới trước khi chat

---

### ❌ TypeScript errors không clear

**Giải pháp:**
```bash
# 1. Delete .next folder
Remove-Item -Recurse -Force .next

# 2. Regenerate Prisma
npx prisma generate

# 3. Restart TS Server
# VSCode: Ctrl+Shift+P → "TypeScript: Restart TS Server"

# 4. Restart dev server
npm run dev
```

---

### ❌ Conversations bị duplicate

**Nguyên nhân:** Multiple create calls hoặc cache issue

**Giải pháp:**
```sql
-- Clean database (CAREFUL! This deletes all chat data)
DELETE FROM chat_messages;
DELETE FROM chat_conversations;

-- Reset auto-increment
ALTER SEQUENCE chat_conversations_id_seq RESTART WITH 1;
ALTER SEQUENCE chat_messages_id_seq RESTART WITH 1;
```

---

## 📊 Testing

### Manual Test

1. **Tạo conversation:**
   - Click "Cuộc trò chuyện mới"
   - Verify: Conversation xuất hiện trong sidebar
   - Verify: Welcome message hiển thị

2. **Chat:**
   - Gửi message: "Hello"
   - Verify: Message xuất hiện ngay lập tức
   - Verify: AI response sau vài giây
   - Check Network tab: 2 POST requests đến `/messages`

3. **Load conversation:**
   - Tạo conversation thứ 2
   - Chat vài messages
   - Click lại conversation đầu
   - Verify: Messages cũ load lại đúng

4. **Rename:**
   - Click ✏️
   - Gõ "Test Rename"
   - Nhấn Enter
   - Verify: Title thay đổi ngay

5. **Delete:**
   - Click 🗑️
   - Click OK trong confirm
   - Verify: Conversation biến mất khỏi list
   - Verify: Nếu đang ở conversation đó → messages clear

6. **Search:**
   - Tạo 3 conversations: "English", "Chinese", "Vietnamese"
   - Gõ search: "Eng"
   - Verify: Chỉ "English" hiện

7. **Mobile:**
   - Resize window < 768px
   - Verify: Sidebar ẩn
   - Click ☰
   - Verify: Sidebar slide in
   - Click backdrop
   - Verify: Sidebar slide out

### Automated API Test

```bash
# 1. Get your token from browser
# DevTools → Application → Cookies → Copy value of 'token'

# 2. Run test script
node test-chat-history-api.js YOUR_TOKEN_HERE

# Expected output:
# ✅ Test 1-10 all pass
# ✅ Create, Read, Update, Delete all working
```

---

## 🚀 Deployment Checklist

- [ ] Run `npx prisma migrate deploy` (production)
- [ ] Verify DATABASE_URL in `.env` or environment variables
- [ ] Check all API routes return proper status codes
- [ ] Test authentication with production tokens
- [ ] Verify mobile responsive on real devices
- [ ] Test on multiple browsers (Chrome, Safari, Firefox)
- [ ] Check SSL/HTTPS for cookie security
- [ ] Monitor database query performance
- [ ] Set up database backups
- [ ] Add error tracking (Sentry, etc.)

---

## 📈 Performance Tips

1. **Lazy Loading:**
   - Messages chỉ load khi click conversation
   - Không load tất cả conversations upfront nếu > 100

2. **Pagination:**
   - Nếu có > 50 conversations, implement pagination
   - Load 20 conversations per page

3. **Debounce Search:**
   - Search đã có debounce built-in (client-side filter)
   - Không gọi API khi search

4. **Optimize Queries:**
   - Index trên `user_id` và `conversation_id`
   - Limit messages trong API response (e.g. last 100)

5. **Client Caching:**
   - Conversations list cache trong React state
   - Chỉ re-fetch khi cần (create, delete, rename)

---

## 🎯 Next Features (Optional)

### Short Term
- [ ] Auto-generate title từ first user message
- [ ] Confirmation dialog với animation
- [ ] Loading skeleton khi fetch conversations
- [ ] Empty state illustration (khi chưa có conversation)

### Medium Term
- [ ] Export conversation to PDF/TXT
- [ ] Pin important conversations to top
- [ ] Conversation categories/tags
- [ ] Archive old conversations (hide but not delete)

### Long Term
- [ ] Share conversation via link (public/private)
- [ ] Full-text search trong messages content
- [ ] Markdown/code syntax highlighting trong messages
- [ ] Collaborative conversations (multiple users)

---

## 📞 Support

Nếu gặp vấn đề:

1. Check console errors (F12 → Console tab)
2. Check Network tab (API responses)
3. Verify database connection
4. Check Prisma schema matches migration
5. Clear browser cache and cookies
6. Restart dev server

**Common Files to Check:**
- `prisma/schema.prisma` - Database schema
- `src/app/api/chat/**/*.ts` - API routes
- `src/components/chat-history-sidebar.tsx` - Sidebar component
- `src/app/chatbot/page.tsx` - Main page logic

---

## ✅ Summary

Hệ thống Chat History đã **hoàn thành 100%** với:

✅ **Database:** 2 tables, relationships, indexes  
✅ **API:** 7 endpoints with full CRUD  
✅ **Frontend:** Beautiful sidebar với search, edit, delete  
✅ **Mobile:** Responsive overlay design  
✅ **Integration:** Auto-save messages, load conversations  
✅ **UI/UX:** Gradient design, smooth animations, Vietnamese locale  

🎉 **Sẵn sàng sử dụng ngay!**

---

*Tài liệu này được tạo ngày 13/01/2025*  
*Version: 1.0.0*
