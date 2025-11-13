# Chat History System - Implementation Plan

## 🎯 Objective
Tạo hệ thống lịch sử trò chuyện cho Chatbot với đầy đủ tính năng CRUD và UI/UX responsive.

## ✅ Completed

### 1. Database Schema (prisma/schema.prisma)
```prisma
model ChatConversation {
  id        Int           @id @default(autoincrement())
  userId    Int           @map("user_id")
  title     String        @default("New Chat")
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  user      User          @relation(...)
  messages  ChatMessage[]
}

model ChatMessage {
  id             Int      @id @default(autoincrement())
  conversationId Int
  role           String   // 'user' or 'assistant'
  content        String   @db.Text
  createdAt      DateTime @default(now())
  conversation   ChatConversation @relation(...)
}
```

### 2. Migration
```bash
npx prisma migrate dev --name add_chat_history
npx prisma generate
```

### 3. API Routes (Partial)
- ✅ `GET /api/chat/conversations` - List conversations
- ✅ `POST /api/chat/conversations` - Create conversation

## 📋 Remaining Tasks

### API Routes (Need to Create)

#### 1. `PUT /api/chat/conversations/[id]/route.ts`
```typescript
// Update conversation title (rename)
export async function PUT(req, { params }) {
  // Verify auth
  // Update title
  // Return updated conversation
}

// Delete conversation
export async function DELETE(req, { params }) {
  // Verify auth
  // Check ownership
  // Delete conversation (cascades to messages)
}
```

#### 2. `GET /api/chat/conversations/[id]/messages/route.ts`
```typescript
// Get all messages in conversation
export async function GET(req, { params }) {
  // Verify auth
  // Fetch messages ordered by createdAt
  // Return messages
}

// Add message to conversation
export async function POST(req, { params }) {
  // Verify auth
  // Create user message
  // Call AI (getChatbotResponseAction)
  // Create assistant message
  // Update conversation.updatedAt
  // Return both messages
}
```

### Frontend Components

#### 1. ChatHistory Sidebar (`src/components/chat-history-sidebar.tsx`)
**Features:**
- List all conversations
- Search/filter conversations
- Create new conversation
- Select conversation
- Responsive (collapsible on mobile)
- Show message count & last message

**Design:**
```tsx
<div className="sidebar">
  <Button onClick={createNew}>+ New Chat</Button>
  <Input placeholder="Search..." />
  
  <div className="conversation-list">
    {conversations.map(conv => (
      <div 
        key={conv.id}
        className={active ? 'active' : ''}
        onClick={() => selectConversation(conv.id)}
      >
        <h4>{conv.title}</h4>
        <p className="last-message">{conv.lastMessage}</p>
        <div className="actions">
          <Button onClick={rename}>✏️</Button>
          <Button onClick={delete}>🗑️</Button>
        </div>
      </div>
    ))}
  </div>
</div>
```

#### 2. Update ChatbotPage (`src/app/chatbot/page.tsx`)
**Changes:**
- Add ChatHistory sidebar
- Load conversation on select
- Save messages to current conversation
- Auto-create conversation on first message
- Sync messages state with database

**Flow:**
```
1. User loads /chatbot
   → Fetch conversations list
   → Create default "New Chat" if none

2. User selects conversation
   → Fetch messages from API
   → Display in ChatbotUI

3. User sends message
   → POST to /api/chat/conversations/[id]/messages
   → Receive user + assistant messages
   → Update UI with new messages

4. User clicks "New Chat"
   → POST to /api/chat/conversations
   → Clear current messages
   → Switch to new conversation

5. User renames conversation
   → PUT to /api/chat/conversations/[id]
   → Update title in sidebar

6. User deletes conversation
   → DELETE to /api/chat/conversations/[id]
   → Remove from list
   → Switch to first available conversation
```

#### 3. Rename Dialog (`src/components/chat-rename-dialog.tsx`)
```tsx
<Dialog>
  <DialogContent>
    <Input 
      value={newTitle}
      onChange={e => setNewTitle(e.target.value)}
      placeholder="Conversation title"
    />
    <Button onClick={handleRename}>Save</Button>
  </DialogContent>
</Dialog>
```

### Mobile Responsiveness

#### Desktop (> 768px)
```
┌──────────────┬─────────────────────────┐
│  Sidebar     │   Chat Messages         │
│  (300px)     │   (flex-1)              │
│              │                         │
│ [+ New Chat] │   User: Hello           │
│              │   AI: Hi there!         │
│ Conversation │                         │
│ Conversation │   [Input + Send]        │
│ Conversation │                         │
└──────────────┴─────────────────────────┘
```

#### Mobile (< 768px)
```
Default: Sidebar hidden
┌─────────────────────────────┐
│ [☰ Menu]  Chat Title  [...]│
├─────────────────────────────┤
│   User: Hello               │
│   AI: Hi there!             │
│                             │
│   [Input + Send]            │
└─────────────────────────────┘

Click menu: Sidebar overlay
┌─────────────────────────────┐
│ [X]  Conversations          │
├─────────────────────────────┤
│ [+ New Chat]                │
│                             │
│ ▶ Conversation 1            │
│   Conversation 2            │
│   Conversation 3            │
│                             │
└─────────────────────────────┘
```

### State Management

Use React Context or Zustand:
```typescript
interface ChatState {
  conversations: Conversation[];
  currentConversationId: number | null;
  messages: Message[];
  isLoading: boolean;
  
  // Actions
  fetchConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<void>;
  selectConversation: (id: number) => Promise<void>;
  renameConversation: (id: number, title: string) => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
}
```

## 🎨 UI/UX Design Guidelines

### Colors & Theme
- Sidebar: `bg-gray-50 dark:bg-gray-900`
- Active conversation: `bg-blue-100 dark:bg-blue-900`
- Hover: `hover:bg-gray-100`
- Icons: Lucide React (MessageSquare, Plus, Edit2, Trash2, Menu)

### Animations
- Sidebar toggle: `transition-transform duration-300`
- Conversation select: `transition-colors duration-200`
- Message append: Fade in from bottom

### Typography
- Conversation title: `font-medium text-sm`
- Last message: `text-xs text-gray-500 truncate`
- Timestamp: `text-xs text-gray-400`

## 🔄 Data Flow

### Save Message
```
User types → Send → 
  1. POST /api/chat/conversations/[id]/messages
     { role: 'user', content: '...' }
  2. Server:
     - Save user message
     - Call AI
     - Save assistant message
     - Update conversation.updatedAt
  3. Response: { userMessage, assistantMessage }
  4. UI: Append both messages
```

### Load Conversation
```
Click conversation →
  1. GET /api/chat/conversations/[id]/messages
  2. Server: Fetch messages ordered by createdAt
  3. Response: { messages: [...] }
  4. UI: Replace current messages
```

### Delete Conversation
```
Click delete →
  1. Confirm dialog
  2. DELETE /api/chat/conversations/[id]
  3. Server: Cascade delete messages
  4. Response: { success: true }
  5. UI: 
     - Remove from list
     - If was active, switch to first available
     - If none left, create new
```

## 📱 Mobile Implementation

### Hamburger Menu
```tsx
const [sidebarOpen, setSidebarOpen] = useState(false);

// Desktop: Always show
// Mobile: Show/hide with button

<div className="lg:flex">
  {/* Mobile header */}
  <div className="lg:hidden">
    <Button onClick={() => setSidebarOpen(true)}>
      <Menu />
    </Button>
  </div>

  {/* Sidebar */}
  <div className={`
    fixed lg:relative
    inset-y-0 left-0
    w-80 lg:w-auto
    transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0
    transition-transform
    z-50 lg:z-auto
  `}>
    <ChatHistorySidebar />
  </div>

  {/* Overlay on mobile */}
  {sidebarOpen && (
    <div 
      className="fixed inset-0 bg-black/50 lg:hidden"
      onClick={() => setSidebarOpen(false)}
    />
  )}

  {/* Main chat */}
  <div className="flex-1">
    <ChatbotUI />
  </div>
</div>
```

## 🚀 Implementation Order

1. ✅ Database schema & migration
2. ✅ Base API routes (GET, POST conversations)
3. ⏳ Remaining API routes (PUT, DELETE, messages)
4. ⏳ ChatHistorySidebar component
5. ⏳ Update ChatbotPage integration
6. ⏳ Rename dialog
7. ⏳ Mobile responsive testing
8. ⏳ Polish & animations

## 📝 Next Steps

### Immediate (Priority 1)
1. Create PUT/DELETE `/api/chat/conversations/[id]/route.ts`
2. Create `/api/chat/conversations/[id]/messages/route.ts`
3. Update `getChatbotResponseAction` to save to database

### Short Term (Priority 2)
1. Build ChatHistorySidebar component
2. Integrate with ChatbotPage
3. Add state management

### Polish (Priority 3)
1. Add animations
2. Mobile testing & refinement
3. Add keyboard shortcuts (Cmd+K for search, etc.)
4. Add conversation export feature

---

**Status:** 🟡 IN PROGRESS (20% complete)
**Estimated Time:** 2-3 hours remaining
**Dependencies:** Prisma schema ✅, Auth system ✅

