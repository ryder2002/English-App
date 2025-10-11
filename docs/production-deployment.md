# Production Deployment Checklist for congnhat.online

## 🌐 Domain Configuration

### 1. Environment Variables (.env.production hoặc hosting platform)
```env
NEXTAUTH_URL="https://congnhat.online"
NEXTAUTH_SECRET="Gr+l5PxdhlfdMkFjDX9bvRc/y0q0RorkEn3f2x9FoDU="
DATABASE_URL="your-production-database-url"

# Email Configuration
EMAIL_SERVICE_ENABLED="true"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="dinhcongnhat.02@gmail.com"
EMAIL_PASS="afeq xbqf gnvn plxa"
EMAIL_FROM="dinhcongnhat.02@gmail.com"
```

### 2. Database Configuration
- Setup production PostgreSQL database
- Run migrations: `npx prisma migrate deploy`
- Optionally migrate data from current database

### 3. Build Configuration
```bash
npm run build
npm start
```

### 4. SSL Certificate
- Ensure HTTPS is enabled for congnhat.online
- Update all HTTP references to HTTPS

### 5. CORS Configuration
- Update any API CORS settings for new domain
- Check if any hardcoded localhost URLs exist

## ✅ Current Status
- ✅ NEXTAUTH_URL updated to https://congnhat.online
- ✅ Email system configured with Gmail SMTP
- ✅ Reset password emails will point to congnhat.online
- ✅ Authentication system ready for production
- ✅ Database schema includes reset token fields

## 🔍 Files to Review Before Deployment
- `next.config.js` - Check for any localhost configurations
- Any hardcoded URLs in components
- API endpoints that might reference localhost

## 📧 Email Reset Flow
When users request password reset:
1. Email sent from: dinhcongnhat.02@gmail.com  
2. Reset link: https://congnhat.online/reset-password?token=xxx
3. User clicks link on production domain
4. Password reset completed on congnhat.online
