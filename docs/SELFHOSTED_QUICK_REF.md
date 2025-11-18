# ⚡ Quick Reference: Self-Hosted Supabase Migration

## 🎯 Your Setup
```
Local DB:   localhost:5432/english_app_db
Supabase:   db.cnenglish.io.vn:5432/postgres
Password:   10122002 (same for both)
```

---

## 🚀 One-Line Migration

```powershell
.\scripts\migrate-to-selfhosted-supabase.ps1
```

---

## 📝 What It Does

1. ✅ Backup `.env` → `.env.backup_TIMESTAMP`
2. ✅ Backup DB → `backups/backup_TIMESTAMP.sql`
3. ✅ Test Supabase connection
4. ✅ Update `.env` with Supabase URL
5. ✅ Deploy schema to Supabase
6. ✅ Restore all data
7. ✅ Verify migration

---

## ✅ After Migration - Quick Test

```powershell
# 1. Check data
npx prisma studio

# 2. Run app
npm run dev

# 3. Open browser
http://localhost:3000

# 4. Test login + features
```

---

## 🔙 Rollback (If Needed)

```powershell
# Find your backup
ls .env.backup_*

# Restore it
Copy-Item .env.backup_YYYYMMDD_HHMMSS .env

# App back to local DB
npm run dev
```

---

## 🆘 Quick Fixes

### Can't connect to Supabase?
```powershell
# Test connection
Test-NetConnection -ComputerName db.cnenglish.io.vn -Port 5432

# Check DNS
nslookup db.cnenglish.io.vn
```

### pg_dump not found?
```powershell
# Add PostgreSQL to PATH
$env:PATH += ";C:\Program Files\PostgreSQL\16\bin"
```

### Data count mismatch?
```powershell
# Count users in both DBs
$env:PGPASSWORD = "10122002"

# Local
psql -h localhost -U postgres -d english_app_db -c "SELECT COUNT(*) FROM \"User\";"

# Supabase
psql -h db.cnenglish.io.vn -U postgres -d postgres -c "SELECT COUNT(*) FROM \"User\";"
```

---

## 📊 New .env After Migration

```properties
# OLD (Commented)
# DATABASE_URL="postgresql://postgres:10122002@localhost:5432/english_app_db"

# NEW (Active)
DATABASE_URL="postgresql://postgres:10122002@db.cnenglish.io.vn:5432/postgres"
```

---

## 🔐 Security Tip

Đổi password sau khi migrate:

```sql
-- On Supabase
ALTER USER postgres WITH PASSWORD 'new_secure_password';
```

Update `.env`:
```properties
DATABASE_URL="postgresql://postgres:new_password@db.cnenglish.io.vn:5432/postgres"
```

---

## 📚 Full Docs

- **Detailed Guide**: `docs/SELFHOSTED_SUPABASE_MIGRATION.md`
- **Script**: `scripts/migrate-to-selfhosted-supabase.ps1`
- **Backups**: `backups/` folder

---

**Ready to migrate?** Just run: `.\scripts\migrate-to-selfhosted-supabase.ps1`
