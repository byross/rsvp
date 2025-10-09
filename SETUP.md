# RSVP 系統設置指南

## 📋 前置要求

1. Node.js 18+ 
2. npm 或 yarn
3. Cloudflare 帳號（免費即可）
4. Git

## 🚀 完整設置流程

### 步驟 1: 安裝依賴

```bash
npm install
```

### 步驟 2: 設置 Cloudflare

#### 2.1 登入 Cloudflare

```bash
npx wrangler login
```

這會打開瀏覽器讓你登入 Cloudflare 帳號。

#### 2.2 創建 D1 資料庫

```bash
npx wrangler d1 create rsvp-db
```

執行後會看到類似以下輸出：

```
✅ Successfully created DB 'rsvp-db'

[[d1_databases]]
binding = "DB"
database_name = "rsvp-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### 2.3 更新 wrangler.toml

複製上面的 `database_id` 並貼到 `wrangler.toml` 文件中：

```toml
[[d1_databases]]
binding = "DB"
database_name = "rsvp-db"
database_id = "你的-database-id-在這裡"  # ← 更新這裡
```

#### 2.4 執行資料庫 Migration

```bash
# 本地開發環境
npm run db:migrate

# 或者直接用 wrangler
npx wrangler d1 migrations apply rsvp-db --local
```

如果要在生產環境執行：

```bash
npm run db:migrate:prod
# 或
npx wrangler d1 migrations apply rsvp-db --remote
```

### 步驟 3: 設置環境變數（可選）

複製環境變數範例文件：

```bash
cp .dev.vars.example .dev.vars
```

編輯 `.dev.vars` 並填入你的值：

```
ALLOWED_ORIGIN=http://localhost:3000
# RESEND_API_KEY=re_xxxxx  # 之後設置
```

### 步驟 4: 啟動開發伺服器

#### 方案 A: 分別啟動（推薦用於開發）

在**第一個終端機**啟動 Next.js 前端：

```bash
npm run dev
```

在**第二個終端機**啟動 Cloudflare Workers API：

```bash
npm run worker:dev
```

現在你可以：
- 訪問前端：http://localhost:3000
- 訪問 API：http://localhost:8787

#### 方案 B: 只啟動前端（如果還不需要 API）

```bash
npm run dev
```

## 🧪 測試設置

### 測試 API

```bash
# 健康檢查
curl http://localhost:8787/

# 獲取測試嘉賓資料
curl http://localhost:8787/api/rsvp/token_abc123

# 提交 RSVP（測試用）
curl -X POST http://localhost:8787/api/rsvp/token_abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試用戶",
    "dinner": true,
    "cocktail": true,
    "workshop_type": "leather",
    "workshop_time": "1700"
  }'
```

### 測試資料庫

```bash
# 查詢本地資料庫
npx wrangler d1 execute rsvp-db --local --command "SELECT * FROM guests"

# 查看資料庫結構
npx wrangler d1 execute rsvp-db --local --command "SELECT name FROM sqlite_master WHERE type='table'"
```

## 📦 部署到生產環境

### 1. 部署 Cloudflare Worker

```bash
npm run worker:deploy
```

### 2. 部署 Next.js 前端

可以部署到以下平台：

#### Vercel（推薦）

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel
```

#### Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy out
```

### 3. 更新環境變數

記得在 `wrangler.toml` 的 `[env.production]` 部分更新：

```toml
[env.production]
vars = { ALLOWED_ORIGIN = "https://你的網域.com" }
```

## 🔧 常見問題

### Q: wrangler 命令找不到？

確保已經安裝：
```bash
npm install -D wrangler
```

使用 npx 執行：
```bash
npx wrangler --version
```

### Q: D1 資料庫連接失敗？

1. 確認 `wrangler.toml` 的 `database_id` 已正確設置
2. 確認已執行 migration：`npm run db:migrate`
3. 檢查是否已登入 Cloudflare：`npx wrangler whoami`

### Q: CORS 錯誤？

確保 Worker 的 `ALLOWED_ORIGIN` 環境變數設置正確：
- 開發環境：`http://localhost:3000`
- 生產環境：你的實際網域

### Q: Migration 失敗？

刪除本地資料庫重新開始：

```bash
rm -rf .wrangler/state/v3/d1
npm run db:migrate
```

## 📚 下一步

設置完成後，你可以：

1. ✅ 查看前端頁面結構
2. ✅ 測試 API endpoints
3. 🔜 開始實現 RSVP 表單功能
4. 🔜 整合 Resend 郵件服務
5. 🔜 實現 QR Code 功能

## 🆘 獲取幫助

- Cloudflare Workers 文檔：https://developers.cloudflare.com/workers/
- Cloudflare D1 文檔：https://developers.cloudflare.com/d1/
- Hono 文檔：https://hono.dev/
- Next.js 文檔：https://nextjs.org/docs

## 📝 相關文件

- [README.md](README.md) - 項目概覽
- [plan.md](plan.md) - 完整項目計劃
- [workers/README.md](workers/README.md) - API 文檔

