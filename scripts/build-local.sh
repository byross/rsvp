#!/bin/bash

# 本地開發構建腳本
# 用於本地測試靜態導出版本

echo "🔧 開始本地開發構建..."

# 設置開發環境變量
export NODE_ENV=development
export NEXT_PUBLIC_API_URL=http://localhost:8787

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
  echo "✅ 正確：使用本地 API URL"
else
  echo "❌ 錯誤：未檢測到本地 API URL！"
  exit 1
fi

echo ""
echo "🎉 構建驗證通過！"
echo "💡 提示：使用 'npx serve out' 來本地預覽"


