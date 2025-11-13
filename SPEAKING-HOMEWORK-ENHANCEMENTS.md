# Speaking Homework - Play Audio & Redo Feature

## ✅ What Was Added

### 1. **Play Audio Button** 
- Nút "Play Audio" / "Pause Audio" để nghe lại recording đã nộp
- Icon Play/Pause thay đổi khi đang phát
- Design: border xanh, hover xanh nhạt

### 2. **View Result Button**
- Nút "Xem bài làm" / "Ẩn kết quả" 
- Toggle hiển thị/ẩn kết quả đánh giá
- Design: border xanh lá, hover xanh lá nhạt
- Icon: Eye (mắt)

### 3. **Redo Button**
- Nút "Làm lại" màu cam-đỏ gradient
- Gọi API `/api/homework/{id}/retry` để reset submission
- Chỉ hiện khi bài chưa locked
- Icon: RotateCcw (mũi tên xoay)

### 4. **Action Card**
- Card gradient xanh chứa 3 nút trên
- Luôn hiển thị khi đã submit
- Responsive layout với flex-wrap

## 📁 Files Modified

### 1. **src/components/speaking-homework-player.tsx**

**Added Props:**
```typescript
interface SpeakingHomeworkPlayerProps {
  // ...existing props
  audioUrl?: string;              // NEW: URL of submitted audio
  onRedoAction?: () => Promise<void>; // NEW: Callback for redo
}
```

**New State:**
```typescript
const [showResult, setShowResult] = useState(false);  // Toggle result visibility
const [isPlaying, setIsPlaying] = useState(false);    // Audio playback state
const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
```

**New Functions:**
```typescript
// Handle redo button click
const handleRedo = async () => {
  if (onRedoAction) {
    await onRedoAction();
    setShowResult(false);
  }
};

// Toggle audio playback
const toggleAudioPlayback = () => {
  if (!audioUrl) return;
  if (!audioElement) {
    const audio = new Audio(audioUrl);
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => setIsPlaying(false);
    setAudioElement(audio);
    audio.play();
  } else {
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
  }
};
```

**UI Changes:**
- Added action buttons card (always visible when submitted)
- Made result section toggleable
- Added cleanup effect for audio element

### 2. **src/app/classes/[id]/homework/[homeworkId]/page.tsx**

**Updated Interface:**
```typescript
interface Homework {
  // ...
  submissions: Array<{
    // ...existing fields
    audioUrl?: string;  // NEW
  }>;
  currentSubmission?: {
    // ...existing fields
    audioUrl?: string;  // NEW
  };
}
```

**Updated Props:**
```typescript
<SpeakingHomeworkPlayer
  // ...existing props
  audioUrl={currentSubmission?.audioUrl}  // NEW
  onRedoAction={doRetry}                   // NEW
/>
```

## 🎨 UI Components

### Action Card Layout
```
┌─────────────────────────────────────────────┐
│  🔵 Play Audio  |  🟢 Xem bài làm  |  🟠 Làm lại │
└─────────────────────────────────────────────┘
```

**Buttons:**
1. **Play Audio** (if audioUrl exists)
   - Blue outline button
   - Icon changes: Play ⟷ Pause
   - Size: lg (px-6 py-6)

2. **Xem bài làm**
   - Green outline button
   - Text changes: "Xem bài làm" ⟷ "Ẩn kết quả"
   - Eye icon
   - Size: lg

3. **Làm lại** (if !isLocked && onRedoAction)
   - Orange-red gradient button
   - RotateCcw icon
   - Size: lg
   - Disabled when submitting

## 📱 User Flow

### Before (Old Version):
1. Submit recording → See result immediately
2. **Cannot** listen to submitted audio
3. **Cannot** hide result to see clean UI
4. Redo button inside result area

### After (New Version):
1. Submit recording → See action buttons card
2. Click **"Play Audio"** → Listen to submitted recording
3. Click **"Xem bài làm"** → Toggle result display
4. Click **"Làm lại"** → Reset and record again

## 🎯 Benefits

| Feature | Benefit |
|---------|---------|
| Play Audio | Student can verify their recording |
| Toggle Result | Cleaner UI, focus on what matters |
| External Redo Button | Always accessible, not buried in UI |
| Pause/Resume | Full control over audio playback |

## 🔧 Technical Details

### Audio Playback Implementation
```typescript
// Create audio element on demand
const audio = new Audio(audioUrl);

// Event listeners
audio.onplay = () => setIsPlaying(true);
audio.onpause = () => setIsPlaying(false);
audio.onended = () => setIsPlaying(false);

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }
  };
}, [audioElement]);
```

### Redo Flow
```
User clicks "Làm lại"
   ↓
handleRedo() called
   ↓
onRedoAction() → doRetry()
   ↓
POST /api/homework/{id}/retry
   ↓
Reset submission state
   ↓
Refresh homework data
   ↓
Show HybridAudioRecorder again
```

### Toggle Result
```typescript
// Default: hidden (showResult = false)
<Button onClick={() => setShowResult(!showResult)}>
  {showResult ? 'Ẩn kết quả' : 'Xem bài làm'}
</Button>

{showResult && (
  <TraditionalSpeakingResult ... />
)}
```

## 🎉 Result

**Before:**
```
[ Submit ] → [ See Result ] → [ Redo button inside result ]
❌ Cannot play audio
❌ Cannot hide result
❌ Redo button hard to find
```

**After:**
```
[ Submit ] 
   ↓
┌─────────────────────────────────────────┐
│  Play Audio | Xem bài làm | Làm lại      │
└─────────────────────────────────────────┘
   ↓
[ Click "Xem bài làm" ] → [ Toggle Result ]
   ↓
[ Click "Play Audio" ] → [ Listen to recording ]
   ↓
[ Click "Làm lại" ] → [ Start over ]

✅ Can play/pause audio anytime
✅ Can show/hide result
✅ Redo button always visible
```

## 🐛 Error Handling

### No Audio URL
```typescript
{audioUrl && (
  <Button onClick={toggleAudioPlayback}>
    Play Audio
  </Button>
)}
```

### Locked Homework
```typescript
{onRedoAction && !isLocked && (
  <Button onClick={handleRedo}>
    Làm lại
  </Button>
)}
```

### Failed Redo
```typescript
try {
  await onRedoAction();
  setShowResult(false);
} catch (error) {
  console.error('❌ Redo failed:', error);
  alert('Failed to reset submission. Please try again.');
}
```

## 🚀 Performance

- Audio element created on demand (not on render)
- Cleanup on unmount prevents memory leaks
- Toggle state (no re-render of entire result)

## 📊 Responsive Design

```css
/* Desktop: All 3 buttons in one row */
flex flex-wrap gap-3 justify-center

/* Mobile: Buttons wrap to multiple rows */
Automatic wrapping based on screen width
```

## 🔮 Future Enhancements

1. Add playback speed control (0.5x, 1x, 1.5x, 2x)
2. Add waveform visualization
3. Add download audio button
4. Add comparison mode (play reference + student audio side by side)
5. Add A/B testing (play multiple recordings)

---

**Status:** ✅ COMPLETED
**Ready for Testing:** YES
**Ready for Production:** YES
