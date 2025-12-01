#!/bin/bash

# Di chuyển vào đúng thư mục dự án
cd /home/congnhat/english-app/English-App

# 1. Lấy code mới
echo "Dang keo code ve..."
git pull origin main

# 2. Cài đặt thư viện (phòng khi có thư viện mới)
echo "Cai dat dependencies..."
npm install

# 3. Build lại web
echo "Dang Build..."
npm run build

# 4. Restart lại PM2 (Để cập nhật code mới lên web)
# Giả sử tên app trong PM2 của bạn là 'english-app', nếu chưa có thì chạy pm2 start...
echo "Restart PM2..."
pm2 reload all

echo "DEPLOY THANH CONG!"
