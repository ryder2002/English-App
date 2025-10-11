# Migration Plan: Firebase to PostgreSQL

## Current Firebase Usage Analysis

### 1. Authentication (Firebase Auth)
- User login/signup/logout
- Password reset
- User session management

### 2. Database (Firestore)
**Collections:**
- `vocabulary` - stores vocabulary items with userId
- `folders` - stores folder names with userId

**Current Data Structure:**
```typescript
// VocabularyItem
{
  id: string;
  word: string;
  language: "english" | "chinese" | "vietnamese";
  vietnameseTranslation: string;
  folder: string;
  partOfSpeech?: string;
  ipa?: string;
  pinyin?: string;
  createdAt: string;
  audioSrc?: string;
  userId: string; // Added by service layer
}

// Folder
{
  name: string;
  userId: string;
  createdAt: timestamp;
}
```

## Migration Strategy

### Phase 1: Database Migration
1. **Setup PostgreSQL + Prisma ORM**
2. **Create database schema**
3. **Implement new database services**
4. **Data migration from Firestore**

### Phase 2: Authentication Migration
1. **Replace Firebase Auth with NextAuth.js**
2. **Update authentication flow**
3. **Migrate user data**

### Phase 3: Testing & Deployment
1. **Test all functionality**
2. **Deploy to production**
3. **Monitor and fix issues**

## Detailed Implementation

### 1. PostgreSQL Schema Design

```sql
-- Users table (replacing Firebase Auth)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Folders table
CREATE TABLE folders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, user_id)
);

-- Vocabulary table
CREATE TABLE vocabulary (
  id SERIAL PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  language VARCHAR(20) NOT NULL CHECK (language IN ('english', 'chinese', 'vietnamese')),
  vietnamese_translation TEXT NOT NULL,
  folder VARCHAR(255) NOT NULL,
  part_of_speech VARCHAR(100),
  ipa VARCHAR(255),
  pinyin VARCHAR(255),
  audio_src VARCHAR(500),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_vocabulary_user_id ON vocabulary(user_id);
CREATE INDEX idx_vocabulary_folder ON vocabulary(folder);
CREATE INDEX idx_vocabulary_language ON vocabulary(language);
CREATE INDEX idx_folders_user_id ON folders(user_id);
```

### 2. Technology Stack Changes

**Current:**
- Firebase Auth
- Firestore
- Firebase SDK

**New:**
- NextAuth.js (Authentication)
- PostgreSQL (Database)
- Prisma ORM (Database ORM)
- bcryptjs (Password hashing)

### 3. Required Dependencies

```json
{
  "dependencies": {
    "next-auth": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/jsonwebtoken": "^9.0.0"
  }
}
```

## Benefits of Migration

### 1. Performance
- Direct SQL queries vs NoSQL document fetching
- Better indexing capabilities
- More efficient joins and complex queries

### 2. Cost
- Predictable pricing model
- No per-operation costs
- Better scaling economics

### 3. Data Integrity
- ACID transactions
- Foreign key constraints
- Better data validation

### 4. Flexibility
- Complex queries with SQL
- Better reporting capabilities
- Easier data analysis

### 5. Vendor Independence
- Not locked into Firebase ecosystem
- Can migrate to any PostgreSQL provider
- More hosting options

## Migration Steps

### Step 1: Setup New Infrastructure
1. Install PostgreSQL dependencies
2. Setup Prisma
3. Create database schema
4. Setup NextAuth.js

### Step 2: Implement New Services
1. Create new database service layer
2. Implement authentication service
3. Update all API calls

### Step 3: Data Migration
1. Export data from Firestore
2. Transform data format
3. Import into PostgreSQL
4. Verify data integrity

### Step 4: Update Frontend
1. Update authentication components
2. Test all user flows
3. Update error handling

### Step 5: Testing
1. Unit tests for new services
2. Integration tests
3. User acceptance testing

### Step 6: Deployment
1. Setup production PostgreSQL
2. Deploy application
3. Monitor performance
4. Handle any issues

## Estimated Timeline
- **Phase 1 (Database):** 3-5 days
- **Phase 2 (Auth):** 2-3 days  
- **Phase 3 (Testing):** 2-3 days
- **Total:** 7-11 days

## Risks & Mitigation
1. **Data Loss Risk:** Backup all Firebase data before migration
2. **Downtime Risk:** Use feature flags for gradual rollout
3. **Performance Risk:** Load test with realistic data
4. **User Experience Risk:** Maintain session during migration
