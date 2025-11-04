# RSVP API - Cloudflare Workers

Cloudflare Workers API 使用 Hono 框架和 D1 資料庫。

## 設置步驟

### 1. 登入 Cloudflare

```bash
npx wrangler login
```

### 2. 創建 D1 資料庫

```bash
# 創建資料庫（只需執行一次）
npx wrangler d1 create rsvp-db
```

執行後會得到一個 `database_id`，將它複製到 `wrangler.toml` 的 `database_id` 欄位。

### 3. 執行資料庫 Migration

```bash
# 本地測試環境
npm run db:migrate

# 生產環境
npm run db:migrate:prod
```

### 4. 啟動開發伺服器

```bash
# 啟動 Worker 開發伺服器（會在 http://localhost:8787 運行）
npm run worker:dev
```

### 5. 部署到 Cloudflare

```bash
npm run worker:deploy
```

## API Endpoints

### Guest Flow

#### `GET /api/rsvp/:token`
獲取嘉賓資料

**參數:**
- `token`: 邀請 token（來自 URL 參數）

**回應:**
```json
{
  "id": "uuid",
  "name": "張三",
  "company": "ABC Company",
  "email": "zhang.san@example.com",
  "invite_type": "named",
  "rsvp_status": "pending"
}
```

#### `POST /api/rsvp/:token`
提交 RSVP 表單

**參數:**
- `token`: 邀請 token

**請求 Body:**
```json
{
  "name": "張三",
  "dinner": true,
  "cocktail": true,
  "workshop_type": "leather",
  "workshop_time": "1700"
}
```

**回應:**
```json
{
  "success": true,
  "message": "RSVP submitted successfully"
}
```

### Admin Flow

#### `GET /api/admin/guests`
獲取所有嘉賓列表（需要身份驗證）

**回應:**
```json
[
  {
    "id": "uuid",
    "name": "張三",
    "email": "zhang.san@example.com",
    "rsvp_status": "confirmed",
    ...
  }
]
```

### Check-in Flow

#### `POST /api/scan`
掃描 QR Code 並簽到

**請求 Body:**
```json
{
  "token": "guest_token"
}
```

**回應:**
```json
{
  "success": true,
  "guest": {
    "id": "uuid",
    "name": "張三",
    "workshop_type": "leather",
    "workshop_time": "1700"
  },
  "message": "Check-in successful"
}
```

**重複掃描回應:**
```json
{
  "error": "Already checked in",
  "guest": {...},
  "status": "duplicate"
}
```

## 本地測試

### 使用 wrangler dev

```bash
# 在一個終端機啟動 Worker
npm run worker:dev

# 在另一個終端機啟動 Next.js
npm run dev
```

### 測試 API

```bash
# 健康檢查
curl http://localhost:8787/

# 獲取嘉賓資料
curl http://localhost:8787/api/rsvp/token_abc123

# 提交 RSVP
curl -X POST http://localhost:8787/api/rsvp/token_abc123 \
  -H "Content-Type: application/json" \
  -d '{"name":"張三","dinner":true,"cocktail":true}'
```

## 環境變數

在 `wrangler.toml` 中配置：

```toml
[env.development]
vars = { ALLOWED_ORIGIN = "http://localhost:3000" }

[env.production]
vars = { ALLOWED_ORIGIN = "https://your-domain.com" }
```

## 資料庫結構

詳見 `migrations/0001_initial_schema.sql`

- `guests`: 嘉賓資料表
- `scan_logs`: 簽到記錄表

## 待辦事項

- [ ] 添加身份驗證中間件（admin endpoints）
- [ ] 實現 Resend 郵件發送
- [ ] 添加 QR Code 生成功能
- [ ] 實現 CSV 導入功能
- [ ] 添加 rate limiting
- [ ] 完善錯誤處理





