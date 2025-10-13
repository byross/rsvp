# 📦 Cloudflare R2 設置指南

## 為什麼要用 R2？

**問題**：郵件中的 QR Code 無法顯示
**原因**：Base64 圖片會被某些郵件客戶端（Gmail、Outlook）阻擋
**解決方案**：將 QR Code 保存到 Cloudflare R2，使用公開 URL

---

## 🚀 設置步驟

### 1. 創建 R2 Bucket（本地開發）

本地開發時，Wrangler 會自動創建 mock R2 bucket，不需要額外設置。

### 2. 更新環境變數

在 `.dev.vars` 添加（本地開發用 mock URL）：

```bash
# R2 Public URL (本地開發用 placeholder)
R2_PUBLIC_URL=http://localhost:8787/qr
```

### 3. 創建本地 QR 圖片訪問端點（可選）

目前代碼已經設置好，Worker 會處理 R2 存儲。

---

## 🌐 生產環境設置

當你準備部署到生產環境時：

### 1. 創建 R2 Bucket

```bash
# 登入 Cloudflare
npx wrangler login

# 創建 R2 bucket
npx wrangler r2 bucket create rsvp-qr-codes
```

### 2. 設置 R2 公開訪問

有兩個選擇：

#### 選項 A：使用 R2.dev 子域名（最簡單）

```bash
# 啟用公開訪問
npx wrangler r2 bucket domain add rsvp-qr-codes --domain auto
```

這會給你一個類似 `https://pub-xxxxxxxxxxxxx.r2.dev` 的 URL。

#### 選項 B：使用自定義域名

1. 到 Cloudflare Dashboard → R2 → 你的 bucket
2. 點擊 "Settings"
3. 添加自定義域名（例如：`qr.yourdomain.com`）

### 3. 更新生產環境配置

在 `wrangler.toml` 更新：

```toml
[env.production]
vars = { 
  ALLOWED_ORIGIN = "https://your-domain.com",
  R2_PUBLIC_URL = "https://pub-xxxxxxxxxxxxx.r2.dev"
}
```

---

## 🧪 本地測試（暫時方案）

目前本地開發 R2 bucket 是 mock 的，所以我們先用替代方案：

### 方案 1：使用外部 URL（推薦用於測試）

修改郵件模板，直接使用 QR Server API URL：

```html
<img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=..." />
```

### 方案 2：添加本地 QR 服務端點

在 Worker 添加一個端點來提供 QR 圖片。

---

## 📊 優勢對比

| 方案 | Base64 內嵌 | 外部 API | R2 存儲 |
|------|-------------|----------|---------|
| 郵件兼容性 | ❌ 差 | ✅ 好 | ✅ 最佳 |
| 載入速度 | ✅ 快 | ⚠️ 一般 | ✅ 快 |
| 可靠性 | ✅ 高 | ⚠️ 依賴外部 | ✅ 高 |
| 成本 | ✅ 免費 | ✅ 免費 | ⚠️ 極低成本 |
| 控制權 | ✅ 完全 | ❌ 無 | ✅ 完全 |

---

## 💡 目前的實現

我已經修改了代碼：

1. ✅ 添加 R2 bucket 綁定到 `wrangler.toml`
2. ✅ 創建 `qr-storage.ts` 處理 R2 存儲
3. ✅ 更新 RSVP 提交流程使用 R2
4. ✅ 更新測試郵件 API 使用 R2

**但是**，本地開發時 R2 是 mock 的，所以需要先部署到 Cloudflare 才能完整測試。

---

## 🎯 下一步

你有兩個選擇：

### 選擇 1：立即部署測試（推薦）

```bash
# 創建生產 R2 bucket
npx wrangler r2 bucket create rsvp-qr-codes

# 啟用公開訪問並獲取 URL
# 將會得到類似：https://pub-xxxxx.r2.dev

# 更新 wrangler.toml 中的 R2_PUBLIC_URL

# 部署 Worker
npx wrangler deploy
```

### 選擇 2：暫時使用直接 URL 方案

修改郵件模板，暫時使用 QR Server API 的直接 URL（不保存到 R2）：

```typescript
// 在 email template 中
<img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}" />
```

---

## ❓ 常見問題

**Q: 本地開發時 R2 如何工作？**  
A: Wrangler 提供 mock R2，功能有限。建議關鍵功能在生產環境測試。

**Q: R2 費用如何？**  
A: 前 10GB 存儲免費，每月前 1M Class A 操作免費。QR 碼很小，基本免費。

**Q: 如果 R2 失敗了怎麼辦？**  
A: 代碼有 fallback 機制，會記錄錯誤但不會阻止 RSVP 提交。

---

**建議**：先部署到 Cloudflare，設置好 R2，然後發一封測試郵件給自己。這樣可以確認 QR Code 在郵件中正確顯示！


