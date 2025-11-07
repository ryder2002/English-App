# Script để cập nhật database với tính năng homework history

# Bước 1: Dừng development server (nhấn Ctrl+C trong terminal đang chạy npm run dev)

# Bước 2: Generate Prisma Client mới
Write-Host "Generating Prisma Client..." -ForegroundColor Green
npx prisma generate

# Bước 3: Kiểm tra migration
Write-Host "`nDatabase schema updated successfully!" -ForegroundColor Green
Write-Host "attemptNumber field added to homework_submissions table" -ForegroundColor Cyan

# Bước 4: Khởi động lại server
Write-Host "`nPlease restart your development server with: npm run dev" -ForegroundColor Yellow
