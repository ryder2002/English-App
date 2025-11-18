# 🚀 Hasura GraphQL Setup Guide

## 📋 Overview

Your Hasura GraphQL Engine is running at:
- **URL**: `https://db.cnenglish.io.vn/v1/graphql`
- **Admin Secret**: `10122002`
- **Database**: `english_app_db` on `db.cnenglish.io.vn:5432`

---

## ✅ Files Created

### 1. **`src/lib/hasura-client.ts`**
Core Hasura GraphQL client with:
- `hasuraRequest()` - Execute queries with admin secret
- `hasuraAuthRequest()` - Execute queries with JWT token
- Error handling and logging

### 2. **`src/lib/hasura-queries.ts`**
Pre-built queries for chat messages:
- `getMessages()` - Fetch all messages
- `getMessageById()` - Fetch single message
- `createMessage()` - Create new message
- `updateMessage()` - Update existing message
- `deleteMessage()` - Delete message
- `getMessagesByUserId()` - Fetch user's messages

### 3. **`src/app/api/hasura/test/route.ts`**
API endpoint to test Hasura connection:
- `GET /api/hasura/test` - Health check
- `POST /api/hasura/test` - Execute custom queries

### 4. **`src/app/test-hasura/page.tsx`**
Interactive UI to test Hasura:
- Quick connection test
- Custom query executor
- Sample queries

---

## 🧪 Testing

### Option 1: Web UI (Easiest)
```bash
npm run dev
```

Navigate to: **http://localhost:3000/test-hasura**

Click "🔍 Test Connection" button

### Option 2: API Endpoint
```bash
curl http://localhost:3000/api/hasura/test
```

### Option 3: Direct Code
```typescript
import { getMessages } from "@/lib/hasura-queries";

const messages = await getMessages(10);
console.log(messages);
```

---

## 📝 Usage Examples

### Example 1: Fetch Messages
```typescript
import { getMessages } from "@/lib/hasura-queries";

export default async function MessagesPage() {
  const messages = await getMessages(20);
  
  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

### Example 2: Create Message
```typescript
import { createMessage } from "@/lib/hasura-queries";

async function handleSubmit(content: string) {
  const newMessage = await createMessage(content, userId);
  
  if (newMessage) {
    console.log("Message created:", newMessage.id);
  }
}
```

### Example 3: Custom Query
```typescript
import { hasuraRequest } from "@/lib/hasura-client";

const query = `
  query GetUserStats($userId: uuid!) {
    users_by_pk(id: $userId) {
      name
      email
      messages_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

const result = await hasuraRequest(query, { userId: "..." });
```

### Example 4: Authenticated Request
```typescript
import { hasuraAuthRequest } from "@/lib/hasura-client";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  const session = await getServerSession();
  const token = session?.accessToken;

  const query = `
    query GetMyMessages {
      chat_messages(
        where: { user_id: { _eq: "x-hasura-user-id" } }
      ) {
        id
        content
      }
    }
  `;

  const result = await hasuraAuthRequest(query, {}, token);
  return Response.json(result);
}
```

---

## 🔐 Environment Variables

Required in `.env`:
```properties
# Hasura Configuration
NEXT_PUBLIC_HASURA_URL="https://db.cnenglish.io.vn/v1/graphql"
HASURA_ADMIN_SECRET="10122002"

# For JWT authentication (optional)
NEXTAUTH_SECRET="YAaQeQBbi4wvcUwt67TlkODcq32HZAspoD3VQmVyP14"
```

---

## 🗄️ Database Schema

Your `chat_messages` table should have:
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

If not exists, create it:
```sql
-- Run this in Hasura SQL tab or pgAdmin

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
```

---

## 🚦 Hasura Console

Access Hasura Console at:
```
https://db.cnenglish.io.vn/console
```

Login with admin secret: `10122002`

From the console you can:
- Track tables
- Create relationships
- Set permissions
- View GraphQL schema
- Test queries

---

## 🔒 Security Best Practices

### 1. Environment Variables
Never commit `.env` to git:
```bash
# Already in .gitignore
.env
.env.local
.env.production
```

### 2. Admin Secret
Change default admin secret in production:
```properties
HASURA_ADMIN_SECRET="generate-long-random-string-here"
```

### 3. JWT Authentication
Configure JWT secret in Hasura:
```json
{
  "type": "HS256",
  "key": "YAaQeQBbi4wvcUwt67TlkODcq32HZAspoD3VQmVyP14"
}
```

### 4. Row Level Security
Set permissions in Hasura Console:
```
Users can only:
- Read their own messages
- Create messages with their user_id
- Update/delete their own messages
```

---

## 🐛 Troubleshooting

### Error: Connection refused
**Cause**: Hasura server not running or wrong URL

**Fix**:
```bash
# Check if Hasura is accessible
curl https://db.cnenglish.io.vn/v1/version

# Check DNS
nslookup db.cnenglish.io.vn

# Check port
Test-NetConnection -ComputerName db.cnenglish.io.vn -Port 443
```

### Error: Unauthorized
**Cause**: Wrong admin secret

**Fix**: Check `.env` file has correct `HASURA_ADMIN_SECRET`

### Error: Table not found
**Cause**: Table not tracked in Hasura

**Fix**:
1. Go to Hasura Console
2. Data → Databases → public
3. Click "Track All" or track specific table

### Error: CORS
**Cause**: CORS not configured

**Fix**: Add your domain to Hasura CORS settings:
```bash
HASURA_GRAPHQL_CORS_DOMAIN: "https://cnenglish.io.vn,http://localhost:3000"
```

---

## 📊 Performance Tips

### 1. Use Indexes
```sql
CREATE INDEX idx_messages_created_at ON chat_messages(created_at DESC);
```

### 2. Limit Results
```typescript
const messages = await getMessages(10); // Not 1000
```

### 3. Use Aggregations
```graphql
query {
  chat_messages_aggregate {
    aggregate {
      count
    }
  }
}
```

### 4. Batch Requests
```typescript
// Use GraphQL batching for multiple queries
const batch = [query1, query2, query3];
const results = await Promise.all(batch.map(q => hasuraRequest(q)));
```

---

## 🔄 Next Steps

1. ✅ Test connection at `/test-hasura`
2. ✅ Create `chat_messages` table if not exists
3. ✅ Track table in Hasura Console
4. ✅ Set up permissions
5. ✅ Test queries in GraphiQL
6. ✅ Integrate into your app
7. ✅ Monitor performance
8. ✅ Setup production environment

---

## 📚 Resources

- **Hasura Docs**: https://hasura.io/docs/
- **GraphQL**: https://graphql.org/learn/
- **Your Console**: https://db.cnenglish.io.vn/console
- **Test Page**: http://localhost:3000/test-hasura

---

**Setup Date**: November 18, 2025  
**Hasura Version**: v2.x  
**Status**: ✅ Ready to use
