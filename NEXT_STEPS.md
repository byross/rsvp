# 🎯 下一步行動計劃

**更新日期**: 2025-10-13  
**當前狀態**: Phase 1-4 已完成 ✅ | Phase 5 進行中 🔄  
**優先重點**: 完成簽到系統

---

## 🚀 立即行動（Phase 5 - 簽到系統）

### 目標
實現完整的 QR Code 掃描和簽到功能，讓活動當天工作人員能夠快速確認嘉賓身份並完成簽到。

---

## 📋 Phase 5 詳細任務

### 1. QR Code 掃描器整合 (2-3 小時)

**任務**:
- [ ] 安裝 `html5-qrcode` 套件
- [ ] 創建掃描器組件 `QRScanner.tsx`
- [ ] 實現相機權限請求
- [ ] 添加掃描成功/失敗回調
- [ ] 添加手動輸入 token 選項（備用方案）

**技術實現**:
```bash
npm install html5-qrcode
```

**檔案位置**: `/Users/ross/Projects/rsvp/rsvp/components/QRScanner.tsx`

**功能需求**:
- 自動啟動相機
- 即時掃描 QR Code
- 掃描成功音效/震動反饋
- 顯示掃描框和指引
- 處理掃描錯誤

---

### 2. 簽到頁面開發 (3-4 小時)

**任務**:
- [ ] 更新 `/checkin/page.tsx`
- [ ] 整合 QRScanner 組件
- [ ] 實現掃描結果處理
- [ ] 顯示嘉賓資訊卡片
- [ ] 添加確認簽到按鈕
- [ ] 實現簽到 API 調用

**頁面結構**:
```
簽到頁面
├── QR 掃描器區域
├── 嘉賓資訊顯示區
│   ├── 姓名/公司
│   ├── RSVP 摘要
│   ├── 工作坊資訊
│   └── 座位編號（如有）
├── 確認按鈕
└── 操作日誌
```

**檔案位置**: `/Users/ross/Projects/rsvp/rsvp/app/checkin/page.tsx`

---

### 3. 後端 API 端點 (1-2 小時)

**任務**:
- [ ] 實現 `POST /api/scan` 端點
- [ ] QR Code 驗證邏輯
- [ ] 檢查重複掃描
- [ ] 更新簽到狀態
- [ ] 記錄 scan_logs
- [ ] 返回嘉賓完整資訊

**API 規格**:
```typescript
POST /api/scan
Body: {
  token: string,
  checksum: string
}

Response: {
  success: boolean,
  guest: {
    id: string,
    name: string,
    company: string,
    dinner: boolean,
    cocktail: boolean,
    workshop_type: string,
    workshop_time: string,
    seat_no: string,
    checked_in: boolean
  },
  alreadyCheckedIn: boolean,
  message: string
}
```

**檔案位置**: `/Users/ross/Projects/rsvp/rsvp/workers/src/index.ts`

---

### 4. 重複掃描處理 (1 小時)

**任務**:
- [ ] 檢測已簽到狀態
- [ ] 顯示警告訊息
- [ ] 提供覆寫選項（管理員）
- [ ] 記錄重複掃描日誌

**UI 設計**:
- 🟢 首次掃描：綠色 + 成功音效
- 🟡 重複掃描：橙色警告 + 已簽到時間
- 🔴 無效 QR：紅色錯誤 + 錯誤原因

---

### 5. 工作坊券提示 (1 小時)

**任務**:
- [ ] 根據嘉賓選擇顯示工作坊資訊
- [ ] 高亮顯示需發放的券種
- [ ] 顯示工作坊時間
- [ ] 添加確認發放按鈕（可選）

**顯示邏輯**:
```
如果選擇工作坊：
  顯示：「⚠️ 請發放：皮革工作坊券 - 17:00」
  顏色：黃色高亮
  字體：加粗
  
如果未選擇：
  顯示：「✓ 無需發放工作坊券」
  顏色：灰色
```

---

### 6. UI/UX 優化 (2 小時)

**任務**:
- [ ] 響應式設計（支援平板）
- [ ] 載入狀態動畫
- [ ] 掃描成功動畫
- [ ] 錯誤提示優化
- [ ] 添加音效（可選）
- [ ] 暗色模式（適合活動現場）

**設計重點**:
- 大按鈕（適合快速操作）
- 高對比度（室外可見）
- 簡潔資訊（快速識別）
- 即時反饋（操作確認）

---

### 7. 測試與驗證 (2 小時)

**測試清單**:
- [ ] 掃描真實 QR Code
- [ ] 測試無效 QR Code
- [ ] 測試重複掃描
- [ ] 測試網路錯誤
- [ ] 測試不同瀏覽器
- [ ] 測試不同設備（手機/平板）

---

## ⏱️ 時間估計

| 任務 | 預計時間 | 優先級 |
|------|---------|--------|
| QR Scanner 組件 | 2-3 小時 | 🔴 高 |
| 簽到頁面開發 | 3-4 小時 | 🔴 高 |
| 後端 API | 1-2 小時 | 🔴 高 |
| 重複掃描處理 | 1 小時 | 🟡 中 |
| 工作坊券提示 | 1 小時 | 🟡 中 |
| UI/UX 優化 | 2 小時 | 🟢 低 |
| 測試驗證 | 2 小時 | 🔴 高 |

**總計**: 12-15 小時（約 2-3 個工作日）

---

## 🔧 技術準備

### 需要安裝的套件
```bash
cd /Users/ross/Projects/rsvp/rsvp
npm install html5-qrcode
```

### 需要參考的文檔
- html5-qrcode: https://github.com/mebjas/html5-qrcode
- Cloudflare D1 Docs: https://developers.cloudflare.com/d1/

### 開發環境
```bash
# Terminal 1: 前端
npm run dev

# Terminal 2: 後端
npm run worker:dev
```

---

## 📝 實作順序建議

### Day 1 (4-5 小時)
1. ✅ 安裝 html5-qrcode
2. ✅ 創建 QRScanner 組件
3. ✅ 實現基本掃描功能
4. ✅ 測試掃描器是否正常工作

### Day 2 (4-5 小時)
5. ✅ 實現後端 `/api/scan` 端點
6. ✅ 開發簽到頁面
7. ✅ 整合前後端
8. ✅ 基本功能測試

### Day 3 (3-4 小時)
9. ✅ 重複掃描處理
10. ✅ 工作坊券提示
11. ✅ UI/UX 優化
12. ✅ 完整測試

---

## 🎯 完成標準

Phase 5 完成的驗收標準：

### 功能測試 ✅
- [ ] 能夠成功掃描 QR Code
- [ ] 正確顯示嘉賓資訊
- [ ] 能夠完成簽到確認
- [ ] 重複掃描顯示警告
- [ ] 工作坊資訊正確顯示
- [ ] 資料正確寫入資料庫

### 性能測試 ✅
- [ ] 掃描響應時間 < 2 秒
- [ ] API 調用時間 < 1 秒
- [ ] 頁面載入時間 < 3 秒

### 兼容性測試 ✅
- [ ] Chrome / Safari 瀏覽器
- [ ] iOS / Android 設備
- [ ] 平板電腦
- [ ] 不同光線條件

---

## 📱 之後的行動（Phase 6）

完成 Phase 5 後：

### 1. 前端部署 (1 天)
- [ ] 部署 Next.js 到 Vercel
- [ ] 配置環境變數
- [ ] 設置自定義域名
- [ ] SSL 證書配置

### 2. 完整測試 (2-3 天)
- [ ] 端到端測試
- [ ] 壓力測試
- [ ] 跨瀏覽器測試
- [ ] 使用者體驗測試

### 3. 優化與監控 (2 天)
- [ ] 性能優化
- [ ] 添加錯誤監控
- [ ] 設置 Analytics
- [ ] 日誌系統

### 4. 文檔完善 (1 天)
- [ ] 使用手冊
- [ ] 故障排除指南
- [ ] API 文檔
- [ ] 部署文檔

---

## 💡 實用提示

### QR Code 掃描最佳實踐
1. 提供良好的光線環境
2. 保持相機穩定
3. QR Code 距離相機 15-30cm
4. 提供手動輸入備用方案

### 活動現場準備
1. 測試現場網路連線
2. 準備備用設備
3. 打印部分紙本名單（備用）
4. 培訓工作人員使用系統

### 性能優化建議
1. 使用 Cloudflare CDN
2. 啟用 API 緩存
3. 優化資料庫查詢
4. 壓縮圖片資源

---

## 📞 需要幫助？

### 遇到問題時
1. 檢查瀏覽器控制台錯誤
2. 查看 Worker 日誌：`npx wrangler tail`
3. 檢查網路請求（DevTools Network）
4. 參考 [docs/testing/COMPLETE_TESTING_GUIDE.md](docs/testing/COMPLETE_TESTING_GUIDE.md)

### 相關文檔
- [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) - 整體進度
- [plan.md](plan.md) - 完整計劃
- [docs/testing/TESTING_SUMMARY.md](docs/testing/TESTING_SUMMARY.md) - 測試記錄

---

**準備好開始了嗎？** 🚀

建議從安裝 `html5-qrcode` 和創建 QRScanner 組件開始！
