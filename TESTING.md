# Phase 2 測試指南

## 啟動開發環境

### 1. 啟動前端服務器

```bash
npm run dev
```

前端將在 http://localhost:3000 運行

### 2. 啟動 Worker API 服務器

```bash
npm run worker:dev
```

Worker API 將在 http://localhost:8787 運行

## 測試 RSVP 表單功能

### 測試場景 1：具名嘉賓（情況一）

1. 訪問：http://localhost:3000/rsvp?invite=test-token-001
2. 驗證：
   - ✓ 姓名欄位已預填（且無法編輯）
   - ✓ 沒有公司欄位
   - ✓ 標題顯示：「親愛的 [姓名]，誠摯邀請您出席」

3. 填寫表單：
   - 選擇「出席晚宴」
   - 選擇「出席雞尾酒會」
   - 可選：勾選「參加工作坊」
     - 選擇工作坊類型（皮革/香水）
     - 選擇時段（16:30/17:00/17:30/18:00）

4. 提交後應跳轉到確認頁面

### 測試場景 2：公司邀請（情況二）

1. 訪問：http://localhost:3000/rsvp?invite=test-token-002
2. 驗證：
   - ✓ 姓名欄位為空（可編輯）
   - ✓ 有公司欄位（選填）
   - ✓ 標題顯示：「請填寫實際出席者資料」

3. 填寫表單：
   - 輸入姓名
   - 輸入公司名稱（選填）
   - 選擇晚宴和雞尾酒會選項
   - 選擇工作坊（可選）

4. 提交後應跳轉到確認頁面

### 測試場景 3：表單驗證

測試以下驗證規則：

- ❌ 未填寫姓名 → 顯示錯誤「請輸入姓名」
- ❌ 未選擇晚宴選項 → 顯示錯誤「請選擇是否出席晚宴」
- ❌ 未選擇雞尾酒會選項 → 顯示錯誤「請選擇是否出席雞尾酒會」
- ❌ 勾選工作坊但未選擇類型/時段 → 顯示錯誤「請選擇工作坊類型和時段」

### 測試場景 4：確認頁面

提交成功後：

1. 驗證確認頁面顯示：
   - ✓ 綠色勾選圖標
   - ✓ 「感謝您的確認！」標題
   - ✓ 顯示提交的資料摘要：
     - 姓名
     - 晚宴選擇
     - 雞尾酒會選擇
     - 工作坊類型和時段（如有選擇）
   - ✓ QR Code 佔位區域
   - ✓ 重要提示說明
   - ✓ 「返回首頁」和「列印確認頁」按鈕

## 測試數據

測試用的 token（需要先執行 migration 並 seed 資料）：

- `test-token-001` - 具名嘉賓（張三）
- `test-token-002` - 公司邀請（ABC 公司）

## API 端點測試

### 測試 GET /api/rsvp/:token

```bash
curl http://localhost:8787/api/rsvp/test-token-001
```

預期回應：
```json
{
  "guest": {
    "id": "...",
    "name": "張三",
    "company": null,
    "email": "test1@example.com",
    "token": "test-token-001",
    "invite_type": "named",
    ...
  }
}
```

### 測試 POST /api/rsvp/:token

```bash
curl -X POST http://localhost:8787/api/rsvp/test-token-001 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "張三",
    "dinner": true,
    "cocktail": true,
    "workshop_type": "leather",
    "workshop_time": "1700"
  }'
```

預期回應：
```json
{
  "success": true,
  "message": "RSVP submitted successfully"
}
```

## UI/UX 檢查清單

### 響應式設計
- [ ] 在桌面瀏覽器測試（1920x1080）
- [ ] 在平板測試（768x1024）
- [ ] 在手機測試（375x667）

### 視覺效果
- [ ] 背景漸層正確顯示
- [ ] 卡片陰影效果
- [ ] 表單元素樣式一致
- [ ] 按鈕 hover 效果
- [ ] 錯誤訊息顯示正確（紅色背景）
- [ ] 提交中狀態（按鈕禁用、文字變更）

### 互動體驗
- [ ] 單選按鈕正確切換
- [ ] 工作坊勾選框展開/收起邏輯
- [ ] 下拉選單選擇流暢
- [ ] 表單驗證即時反饋
- [ ] 頁面跳轉順暢

## 已知問題

1. 目前 API 調用會失敗，因為 D1 資料庫尚未創建
   - 解決方案：執行 `npm run db:create` 和 `npm run db:migrate`

2. QR Code 生成功能尚未實現（Phase 6）
   - 目前顯示佔位文字

3. 郵件發送功能尚未實現（Phase 3）
   - 目前僅顯示「郵件已發送」提示

## 下一步

Phase 2 完成後，接下來將進行：

- **Phase 3**: 郵件系統整合（Resend + QR Code 生成）
- **Phase 4**: 管理面板（CSV 導入、嘉賓列表）
- **Phase 5**: 簽到系統（QR Code 掃描）

---

**測試日期**: 2025-10-09  
**測試範圍**: Phase 2 - RSVP Form  
**狀態**: ✅ 基本功能完成

