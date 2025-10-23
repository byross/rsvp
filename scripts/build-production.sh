#!/bin/bash

# 生產環境構建腳本
# 確保所有環境變量正確設置

echo "🚀 開始生產環境構建..."

# 設置生產環境變量
export NODE_ENV=production
export NEXT_PUBLIC_API_URL=https://rsvp-api.byross-tech.workers.dev

echo "📝 環境變量："
echo "  NODE_ENV=$NODE_ENV"
echo "  NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"

# 執行構建
echo "🔨 執行構建..."
npm run build:pages

echo "✅ 構建完成！"
echo ""
echo "📦 驗證構建結果..."
if grep -r "localhost:8787" out/ > /dev/null; then
  echo "❌ 錯誤：檢測到 localhost API URL！"
  exit 1
fi

if grep -r "rsvp-api.byross-tech.workers.dev" out/ > /dev/null; then
  echo "✅ 正確：使用生產環境 API URL"
else
  echo "⚠️  警告：未檢測到生產環境 API URL"
fi

echo ""
echo "🎉 構建驗證通過！可以部署了"


