# Fix Batch Add Vocabulary Error
# Run this script to regenerate Prisma Client with new 'example' field

Write-Host "🔧 Fixing Batch Add Vocabulary Error..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Regenerate Prisma Client
Write-Host "📦 Step 1: Regenerating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client regenerated successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to regenerate Prisma Client" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ Fix completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your development server (npm run dev)" -ForegroundColor White
Write-Host "2. Test batch add vocabulary" -ForegroundColor White
Write-Host "3. Check that examples are generated automatically" -ForegroundColor White
Write-Host ""
