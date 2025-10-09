# 🔐 環境變數與 Secrets 設置指南

## 概述

本項目使用 Cloudflare Workers 的環境變數和 Secrets 來管理配置和敏感資料。

---

## 📁 文件說明

### `.dev.vars` （本地開發）
- ✅ 已加入 `.gitignore`，**不會** commit
- ✅ 包含所有敏感資料（API keys, passwords）
- ✅ 由 `wrangler dev` 自動載入

### `.dev.vars.example` （範例檔案）
- ✅ **會** commit 到 git
- ✅ 提供配置範例，不含實際敏感值
- ✅ 新開發者可複製為 `.dev.vars`

### `wrangler.toml` （Worker 配置）
- ✅ **會** commit 到 git
- ✅ 包含非敏感的配置
- ⚠️ **不應該** 包含任何密鑰或密碼

---

## 🛠️ 本地開發設置

### 步驟 1：創建 .dev.vars 文件

已經為你創建好了！位於：`/Users/ross/Projects/rsvp/rsvp/.dev.vars`

內容包括：
- ✅ Resend API Key（已設置）
- ✅ 郵件發送者設置
- ✅ 活動資訊
- ✅ QR Code 密鑰
- ✅ Admin 密碼

### 步驟 2：啟動開發服務器

```bash
npm run worker:dev
```

Wrangler 會自動從 `.dev.vars` 載入環境變數。

### 步驟 3：驗證配置

訪問 http://localhost:8787 確認 Worker 正常運行。

---

## 🚀 生產環境設置

### 方法 1：使用 Wrangler CLI（推薦）

對於敏感資料（如 API Keys），使用 `wrangler secret` 命令：

```bash
# 登入 Cloudflare
npx wrangler login

# 設置 Resend API Key
npx wrangler secret put RESEND_API_KEY
# 輸入: re_FSsU1i68_FzMMkFUfpqyDDf5wVNw4Tvkv

# 設置 QR Code 密鑰
npx wrangler secret put QR_SECRET
# 輸入你的隨機密鑰

# 設置 Admin 密碼
npx wrangler secret put ADMIN_PASSWORD
# 輸入你的強密碼
```

### 方法 2：使用 Cloudflare Dashboard

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇你的 Worker
3. 進入 **Settings** > **Variables**
4. 點擊 **Add variable**
5. 選擇 **Encrypt** 設置 Secret

---

## 📋 需要設置的環境變數

### 🔒 Secrets（敏感，需加密）

| 變數名稱 | 用途 | 如何獲取 |
|---------|------|---------|
| `RESEND_API_KEY` | Resend 郵件服務 | https://resend.com → API Keys |
| `QR_SECRET` | QR Code 驗證密鑰 | 生成隨機字串（至少 32 字元）|
| `ADMIN_PASSWORD` | 管理面板密碼 | 設定強密碼 |

### 📝 Variables（非敏感，可公開）

這些已在 `wrangler.toml` 中設置，無需額外操作：

| 變數名稱 | 預設值 | 說明 |
|---------|--------|------|
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | 郵件發送者地址 |
| `RESEND_FROM_NAME` | `活動邀請系統` | 郵件發送者名稱 |
| `EVENT_NAME` | `活動邀請` | 活動名稱 |
| `EVENT_DATE` | `2025-10-15` | 活動日期 |
| `EVENT_VENUE` | `活動場地` | 活動地點 |
| `ALLOWED_ORIGIN` | 依環境而定 | CORS 允許來源 |

---

## 🔍 驗證設置

### 本地驗證

```bash
# 啟動 Worker
npm run worker:dev

# 在另一個終端測試
curl http://localhost:8787
```

### 生產環境驗證

部署後測試：

```bash
# 部署 Worker
npm run worker:deploy

# 測試 API
curl https://your-worker.workers.dev
```

---

## 🔄 更新 Secrets

### 更新本地 Secret

直接編輯 `.dev.vars` 文件，然後重啟 Worker：

```bash
# Ctrl+C 停止
npm run worker:dev  # 重新啟動
```

### 更新生產 Secret

重新執行 `wrangler secret put` 命令：

```bash
npx wrangler secret put RESEND_API_KEY
# 輸入新的值
```

---

## ⚠️ 安全最佳實踐

### ✅ 應該做的

- ✅ 使用 `.dev.vars` 存放本地開發的敏感資料
- ✅ 使用 `wrangler secret` 設置生產環境的敏感資料
- ✅ 定期輪換 API Keys 和密碼
- ✅ 使用強密碼（至少 16 字元）
- ✅ 限制 API Key 的權限範圍

### ❌ 不應該做的

- ❌ 將 `.dev.vars` commit 到 git
- ❌ 在 `wrangler.toml` 中存放敏感資料
- ❌ 在代碼中硬編碼 API Keys
- ❌ 在 commit message 或 PR 中暴露密鑰
- ❌ 將密鑰分享到公開的聊天頻道

---

## 📞 故障排除

### 問題：Worker 無法讀取環境變數

**解決方案**：
1. 確認 `.dev.vars` 文件存在且格式正確
2. 重啟 `wrangler dev`
3. 檢查 TypeScript 類型定義（`workers/src/index.ts` 的 `Bindings` 類型）

### 問題：生產環境 Secret 未生效

**解決方案**：
1. 確認已執行 `wrangler secret put` 命令
2. 重新部署 Worker：`npm run worker:deploy`
3. 在 Cloudflare Dashboard 檢查 Secret 是否正確設置

### 問題：忘記 Secret 的值

**解決方案**：
- Secret 無法讀取，只能重新設置
- 執行 `wrangler secret put SECRET_NAME` 設置新值

---

## 🎯 當前狀態

### ✅ 已完成

- [x] 創建 `.dev.vars` 文件
- [x] 設置 Resend API Key
- [x] 更新 `wrangler.toml` 配置
- [x] 更新 TypeScript 類型定義
- [x] 創建 `.dev.vars.example` 範例

### 🔜 待完成（部署時）

- [ ] 登入 Cloudflare：`npx wrangler login`
- [ ] 設置生產環境 Secrets
- [ ] 驗證自訂域名（如需使用自己的郵件地址）
- [ ] 部署到生產環境

---

**最後更新**: 2025-10-09  
**負責人**: Ross Chang  
**安全等級**: 🔴 高度敏感 - 請妥善保管所有密鑰

