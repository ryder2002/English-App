# Cloudflare Email Setup for English App

## Option 1: Cloudflare Worker + MailChannels (Recommended - FREE)

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Deploy the Email Worker
```bash
cd cloudflare-worker
wrangler deploy
```

### 4. Set the Secret Token
```bash
wrangler secret put EMAIL_WORKER_TOKEN
# Enter a strong random token when prompted
```

### 5. Update your .env file
```env
EMAIL_SERVICE_ENABLED="true"
EMAIL_SERVICE_PROVIDER="cloudflare"
CLOUDFLARE_EMAIL_WORKER_URL="https://english-app-email-worker.YOUR_SUBDOMAIN.workers.dev"
CLOUDFLARE_EMAIL_WORKER_TOKEN="your-secret-token"
CLOUDFLARE_EMAIL_FROM="noreply@yourdomain.com"
```

### 6. Setup SPF Record (Optional but recommended)
Add this TXT record to your domain DNS:
```
v=spf1 include:relay.mailchannels.net ~all
```

---

## Option 2: Cloudflare Email API (If domain is on Cloudflare)

### 1. Get your Cloudflare Account ID
- Go to Cloudflare Dashboard
- Copy Account ID from the right sidebar

### 2. Create API Token
- Go to Profile > API Tokens
- Create Custom Token with permissions:
  - Zone:Email:Edit
  - Account:Email Routing:Edit

### 3. Update your .env file
```env
EMAIL_SERVICE_ENABLED="true"
EMAIL_SERVICE_PROVIDER="cloudflare-api"
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_TOKEN="your-api-token"
CLOUDFLARE_EMAIL_FROM="noreply@yourdomain.com"
```

---

## Testing

After setup, test the forgot password functionality:

1. Go to `http://localhost:3001/forgot-password`
2. Enter a valid email address
3. Check email for reset link
4. Follow the link to reset password

## Troubleshooting

### Worker not receiving requests
- Check the worker URL is correct
- Verify the secret token matches
- Check Cloudflare Workers logs

### Emails not being sent
- Verify SPF record is set up
- Check MailChannels status
- Review worker logs for errors

### API errors
- Verify Account ID and API token
- Check token permissions
- Ensure domain is active on Cloudflare
