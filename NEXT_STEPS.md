# 🎯 下一步行動指南

**現況**: 後端 API 已完全部署並測試成功 ✅  
**目標**: 完成前端整合並測試完整流程

---

## 🚦 立即行動（10 分鐘內）

### 1. 更新前端 API 配置

創建環境變數文件：

```bash
cd /Users/ross/Projects/rsvp/rsvp
```

創建 `.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://rsvp-api.byross-tech.workers.dev
```

### 2. 測試前端頁面

```bash
# 確保前端服務運行
npm run dev
```

訪問以下頁面測試：
- http://localhost:3000 - 首頁
- http://localhost:3000/admin - Admin 面板
- http://localhost:3000/admin/guests - 嘉賓列表
- http://localhost:3000/rsvp?invite=token_abc123 - RSVP 表單

---

## 📝 完整測試流程（30 分鐘）

### 測試 1: 使用生產 API 提交 RSVP

在瀏覽器訪問：
```
http://localhost:3000/rsvp?invite=token_abc123
```

填寫表單：
- 晚宴：是
- 雞尾酒會：是
- 工作坊：皮革工作坊，17:00

提交後檢查：
- [ ] 跳轉到確認頁面
- [ ] 收到確認郵件（ross@byross.net 或測試資料的郵箱）
- [ ] 郵件中 QR Code 正常顯示
- [ ] QR Code 可以點擊打開

### 測試 2: 檢查 Admin 面板

訪問：http://localhost:3000/admin

確認：
- [ ] 統計數字更新（已確認從 1 變成 2）
- [ ] 工作坊人數增加
- [ ] 資料即時更新

### 測試 3: CSV 導入

訪問：http://localhost:3000/admin/import

上傳 `test-guests.csv`：
- [ ] 文件上傳成功
- [ ] 顯示導入結果
- [ ] 嘉賓列表增加 5 位

### 測試 4: CSV 匯出

在嘉賓列表頁面：
- [ ] 點擊「匯出 CSV」
- [ ] 文件自動下載
- [ ] 打開文件確認資料完整

---

## 🔧 如果前端無法連接 API

### 選項 A：使用 Next.js Rewrites（推薦）

更新 `next.config.ts`:

```typescript
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://rsvp-api.byross-tech.workers.dev/api/:path*'
      }
    ]
  }
}
```

### 選項 B：直接使用生產 URL

在前端代碼中直接使用：
```typescript
const API_URL = 'https://rsvp-api.byross-tech.workers.dev';
```

---

## 🌐 部署前端到 Vercel（可選）

如果要公開訪問：

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel

# 按提示操作
```

部署後需要：
1. 設置環境變數 `NEXT_PUBLIC_API_URL`
2. 更新 Worker 的 CORS 設置
3. 測試完整流程

---

## 📊 測試檢查清單

### 基本功能 ✅
- [x] API 健康檢查
- [x] 郵件發送
- [x] QR Code 生成
- [x] QR Code 顯示
- [ ] 前端 RSVP 提交
- [ ] Admin 統計顯示
- [ ] CSV 導入/匯出

### 完整流程 🔄
- [ ] 嘉賓收到邀請連結
- [ ] 填寫 RSVP 表單
- [ ] 提交成功跳轉
- [ ] 收到確認郵件
- [ ] QR Code 正常顯示
- [ ] Admin 看到更新

### UI/UX 🎨
- [ ] 響應式設計
- [ ] 載入狀態
- [ ] 錯誤提示
- [ ] 表單驗證
- [ ] 按鈕反饋

---

## 🎯 Phase 5: 簽到系統（下一個大功能）

當前端完全測試通過後，可以開始：

### 簽到頁面功能
- QR Code 掃描器（使用手機相機或上傳圖片）
- 即時顯示嘉賓資訊
- 重複掃描警告
- 工作坊券發放提示
- 簽到記錄日誌

### 技術需求
- 前端 QR Code 掃描庫（如 `html5-qrcode`）
- 即時驗證 API
- 離線模式支援（可選）

---

## 💡 優化建議

### 效能
- [ ] 添加 API 緩存
- [ ] 優化圖片大小
- [ ] 壓縮 QR Code
- [ ] CDN 加速

### 安全
- [ ] 實現 Admin 登入
- [ ] Token 過期機制
- [ ] Rate limiting
- [ ] CSRF 保護

### 監控
- [ ] Cloudflare Analytics
- [ ] 錯誤追蹤（Sentry）
- [ ] 郵件發送監控
- [ ] API 使用統計

---

## 📞 需要幫助？

遇到問題時檢查：
1. **瀏覽器控制台** - 查看前端錯誤
2. **Wrangler Logs** - `npx wrangler tail`
3. **Cloudflare Dashboard** - Workers & Pages 頁面
4. **測試文檔** - `COMPLETE_TESTING_GUIDE.md`

---

**準備好測試了嗎？開始吧！** 🚀

