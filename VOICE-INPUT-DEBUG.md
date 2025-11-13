# 🎤 Voice Input Check - Hướng Dẫn Debug

## Vấn Đề: "Phần voice bị lỗi"

Tôi đã tạo 2 tools để bạn debug voice input:

---

## 🧪 Tool 1: Test Page (Nhanh nhất)

### Cách test:
```
1. Mở browser
2. Vào: http://localhost:3000/test-speech.html
3. Click "Bắt đầu nghe"
4. Nói thử: "Xin chào"
```

### Kết quả mong đợi:
- ✅ Thấy chữ "Speech Recognition được hỗ trợ!"
- ✅ Click "Bắt đầu nghe" → Thấy "Đang nghe..."
- ✅ Nói → Thấy text hiện trong box "Final"

### Nếu lỗi:
- ❌ "Trình duyệt không hỗ trợ" → Đổi sang Chrome/Edge
- ❌ "Quyền microphone bị từ chối" → Xem hướng dẫn bên dưới
- ❌ "Lỗi kết nối mạng" → Check internet (Speech Recognition cần online)

---

## 📖 Tool 2: Troubleshooting Guide

Xem file: `docs/voice-input-troubleshooting.md`

Có tất cả:
- ✅ Common errors và cách fix
- ✅ Browser console commands để test
- ✅ Step-by-step debug guide
- ✅ Known issues

---

## ⚡ Quick Fixes

### Fix 1: Grant Microphone Permission
```
1. Click icon 🔒 ở thanh address bar
2. Tìm "Microphone"
3. Chọn "Allow"
4. Refresh (F5)
```

### Fix 2: Check Browser
```
✅ Chrome - Best support
✅ Edge - Good support  
⚠️ Safari - Limited support
❌ Firefox - Not supported

→ Dùng Chrome để test
```

### Fix 3: Check Console Errors
```
F12 → Console tab
Tìm errors màu đỏ liên quan đến:
- SpeechRecognition
- microphone
- getUserMedia
```

---

## 🔍 Debug trong Chatbot

### Test trong app:
```
1. Mở http://localhost:3000/chatbot
2. F12 → Console tab
3. Click nút Mic 🎤
4. Xem console logs
```

### Expected console output (working):
```
🎤 Starting recognition...
Language: vi-VN
Recognition object: SpeechRecognition {...}
✅ Mic permission granted
📝 Transcript: xin chào
```

### Error examples:
```
❌ not-allowed → Microphone permission denied
❌ no-speech → Không nghe thấy tiếng
❌ network → Mất internet
```

---

## 🐛 Common Issues

### Issue 1: Không nghe thấy gì
**Check:**
- Microphone có work không? (Test: onlinemictest.com)
- Volume có bật không?
- Browser có permission không?

### Issue 2: Component không hiện
**Check:**
- Console có error "SpeechRecognition is not defined"?
- Browser version có mới nhất không?

### Issue 3: Transcript trống
**Check:**
- Network tab có requests failed không?
- Internet connection OK không?
- Language đúng với ngôn ngữ đang nói không?

---

## 📝 Manual Test Commands

Paste vào Console (F12) để test:

### Test 1: Check Support
```javascript
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
console.log('Speech Recognition:', SR ? '✅ Supported' : '❌ Not Supported');
```

### Test 2: Check Microphone Permission
```javascript
navigator.permissions.query({ name: 'microphone' })
  .then(result => console.log('Mic Permission:', result.state));
```

### Test 3: Direct Test
```javascript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'vi-VN';
recognition.onresult = (e) => console.log('📝', e.results[0][0].transcript);
recognition.onerror = (e) => console.error('❌', e.error);
recognition.start();
console.log('🎤 Started! Speak now...');
```

---

## 🎯 Next Steps

**Nếu test page work:**
- Voice input trong app chắc chắn sẽ work
- Issue có thể do UI/UX (button bị ẩn, dialog không hiện, etc.)

**Nếu test page không work:**
- Issue ở browser/system level
- Follow troubleshooting guide để fix permissions/browser

**Sau khi fix:**
- Test lại trong chatbot
- Thử 3 ngôn ngữ: English, Vietnamese, Chinese
- Check xem transcript có chính xác không

---

## 📞 Báo Lỗi

Nếu vẫn không work, cho tôi biết:

1. **Browser & Version:**
   ```
   Vào: chrome://version (hoặc edge://version)
   Copy: Version number
   ```

2. **Test Page Result:**
   ```
   http://localhost:3000/test-speech.html
   Screenshot của page
   ```

3. **Console Errors:**
   ```
   F12 → Console tab
   Screenshot errors màu đỏ
   ```

4. **Permission Status:**
   ```
   Click 🔒 icon → Site settings
   Screenshot microphone permission
   ```

---

## ✅ Summary

**Created:**
- ✅ `public/test-speech.html` - Standalone test page
- ✅ `docs/voice-input-troubleshooting.md` - Full guide

**Next:**
- 🧪 Test với test page trước
- 📖 Đọc troubleshooting guide nếu có lỗi
- 💬 Báo lại kết quả

**Common Fix (90% cases):**
```
Chrome → Settings → Site Settings → Microphone
→ Add site to "Allowed" list
→ Refresh page
→ Try again
```

---

*Hãy test và cho tôi biết kết quả!* 🎤

