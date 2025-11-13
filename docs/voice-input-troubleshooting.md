# Voice Input Troubleshooting Guide

## Common Issues & Solutions

### 1. **Microphone Permission Denied**
**Symptoms:**
- Error message: "Vui lòng cấp quyền truy cập microphone"
- Mic button doesn't work

**Solution:**
```
1. Click the 🔒 icon in browser address bar
2. Find "Microphone" permission
3. Change to "Allow"
4. Refresh page (F5)
```

### 2. **Browser Not Supported**
**Symptoms:**
- Error: "Trình duyệt không hỗ trợ Speech Recognition"

**Solution:**
- Use Chrome, Edge, or Opera (latest versions)
- Safari: Speech Recognition may not work well
- Firefox: Not supported

### 3. **Speech Recognition API Check**

Open browser console (F12) and run:
```javascript
// Check if Speech Recognition is available
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
console.log('Speech Recognition:', SR ? 'Supported ✅' : 'Not Supported ❌');

// Check microphone permission
navigator.permissions.query({ name: 'microphone' })
  .then(result => console.log('Mic Permission:', result.state));
```

### 4. **Specific Error Messages**

#### "no-speech"
- **Cause:** No voice detected
- **Fix:** Speak louder or check mic is not muted

#### "not-allowed"  
- **Cause:** Permission denied
- **Fix:** Grant microphone permission in browser settings

#### "network"
- **Cause:** Internet connection issue
- **Fix:** Check internet connection (Speech Recognition needs online)

### 5. **Language Selection Issues**
- Default: Vietnamese (vi-VN)
- Switch language before speaking
- Switching language while recording will restart recognition

### 6. **Transcript Not Appearing**
**Check:**
```javascript
// In browser console
console.log('Is Listening:', isListening);
console.log('Transcript:', transcript);
console.log('Recognition Object:', recognitionRef.current);
```

### 7. **Manual Test**

Run this in console to test Speech Recognition directly:
```javascript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'vi-VN'; // or 'en-US', 'zh-CN'
recognition.onresult = (event) => {
  console.log('Result:', event.results[0][0].transcript);
};
recognition.start();
console.log('Started! Speak now...');
```

## Debug Steps

### Step 1: Check Console Errors
```
F12 → Console tab
Look for red errors related to:
- SpeechRecognition
- getUserMedia
- microphone
```

### Step 2: Check Network Tab
```
F12 → Network tab
Click mic button
Look for any failed requests
```

### Step 3: Check Component State
```javascript
// Add console.log in speech-recognition.tsx
console.log('Recognition initialized:', recognitionRef.current);
console.log('Is supported:', isSupported);
console.log('Selected language:', selectedLanguage);
```

### Step 4: Test on Different Browser
- Chrome: Best support ✅
- Edge: Good support ✅
- Opera: Good support ✅
- Safari: Limited support ⚠️
- Firefox: Not supported ❌

## Common Fixes

### Fix 1: Clear Browser Cache
```
Ctrl + Shift + Delete
→ Clear cache and cookies
→ Refresh page
```

### Fix 2: Reset Permissions
```
Chrome: chrome://settings/content/microphone
Edge: edge://settings/content/microphone
→ Remove site from blocked list
→ Refresh page
```

### Fix 3: Test Microphone Separately
```
Windows: Settings → Sound → Test your microphone
Or visit: https://www.onlinemictest.com/
```

### Fix 4: Update Browser
```
Chrome: chrome://settings/help
Edge: edge://settings/help
→ Update to latest version
```

## Known Issues

### Issue 1: Mobile Safari
- Speech Recognition may not work properly
- Use Chrome on iOS instead

### Issue 2: Private/Incognito Mode
- May block microphone access
- Use normal browser window

### Issue 3: HTTPS Required
- Speech Recognition only works on HTTPS
- localhost is OK for development

## Quick Test Code

Add this to `speech-recognition.tsx` for debugging:

```typescript
// At the top of startListening()
console.log('🎤 Starting recognition...');
console.log('Language:', selectedLanguage.code);
console.log('Recognition object:', recognitionRef.current);

// In recognition.onresult
console.log('📝 Transcript:', transcriptPart);
console.log('Is final:', event.results[i].isFinal);

// In recognition.onerror
console.log('❌ Error:', event.error);
console.log('Message:', event.message);
```

## Expected Console Output (Working)

```
🎤 Starting recognition...
Language: vi-VN
Recognition object: SpeechRecognition {...}
Mic Permission: granted
📝 Transcript: xin chào
Is final: false
📝 Transcript: xin chào
Is final: true
```

## User Instructions

**Vietnamese:**
```
1. Click nút Mic (🎤) bên cạnh ô nhập
2. Cho phép quyền truy cập microphone nếu được hỏi
3. Chọn ngôn ngữ (English/Tiếng Việt/中文)
4. Click "Bắt đầu nghe"
5. Nói vào mic
6. Click "Xong" khi hoàn tất
```

**English:**
```
1. Click Mic button (🎤) next to input
2. Allow microphone permission if asked
3. Select language (English/Vietnamese/Chinese)
4. Click "Start Listening"
5. Speak into microphone
6. Click "Done" when finished
```

---

## Report Issue

If voice input still doesn't work, provide:
1. Browser name and version
2. Operating System
3. Error message from console (F12)
4. Screenshot of the issue

---

*Last updated: 14/01/2025*
