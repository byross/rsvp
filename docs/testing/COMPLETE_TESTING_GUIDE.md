# 🎉 RSVP 系統完整測試指南

## 📋 概覽

本系統已完成 Phase 1-4 的開發，包括：
- ✅ **Phase 1**: 基礎設置與資料庫
- ✅ **Phase 2**: RSVP 表單系統
- ✅ **Phase 3**: 郵件系統與 QR Code
- ✅ **Phase 4**: Admin 管理面板

**總進度**: 4/6 階段完成 (67%)

---

## 🚀 快速開始

### 1. 啟動服務

確保以下服務正在運行：

```bash
# Terminal 1 - 前端 (Next.js)
cd /Users/ross/Projects/rsvp/rsvp
npm run dev
# → http://localhost:3000

# Terminal 2 - 後端 API (Cloudflare Workers)
cd /Users/ross/Projects/rsvp/rsvp
npm run worker:dev
# → http://localhost:8787
```

### 2. 初始化資料庫

```bash
cd /Users/ross/Projects/rsvp/rsvp

# 創建 D1 資料庫結構
npx wrangler d1 execute rsvp-db --local --file=workers/migrations/0001_initial_schema.sql

# 導入測試資料
npx wrangler d1 execute rsvp-db --local --file=workers/migrations/0002_seed_data.sql
```

---

## 🧪 完整測試流程

### 測試 1：首頁與導航

**目標**: 驗證系統首頁和導航功能

1. **訪問首頁**
   ```
   http://localhost:3000
   ```

2. **驗證**
   - ✅ Hero section 正確顯示
   - ✅ 功能卡片展示（電子邀請、活動預約、QR Code、簽到管理）
   - ✅ 快速導航連結正常工作
   - ✅ 狀態顯示：Phase 1 完成 ✅ / Phase 2 開發中 🚧

3. **測試導航**
   - 點擊「測試 RSVP 表單」→ 跳轉到 `/rsvp?invite=test-token-001`
   - 點擊「管理面板」→ 跳轉到 `/admin`
   - 點擊「CSV 導入」→ 跳轉到 `/admin/import`
   - 點擊「簽到系統」→ 跳轉到 `/checkin`

---

### 測試 2：Admin 管理面板

**目標**: 測試完整的 Admin 功能

#### 2.1 統計資料展示

1. **訪問 Admin 主頁**
   ```
   http://localhost:3000/admin
   ```

2. **驗證統計卡片**
   - ✅ 總邀請數：應顯示測試資料數量
   - ✅ 已確認：綠色標籤，顯示數量和百分比
   - ✅ 待回覆：橙色標籤
   - ✅ 已婉拒：灰色標籤

3. **驗證活動統計**
   - ✅ 晚宴出席人數
   - ✅ 雞尾酒會出席人數

4. **驗證工作坊統計**
   - ✅ 皮革工作坊總人數
   - ✅ 香水工作坊總人數
   - ✅ 各時段人數分布（16:30/17:00/17:30/18:00）

#### 2.2 CSV 導入功能

1. **訪問導入頁面**
   ```
   http://localhost:3000/admin/import
   ```

2. **準備測試 CSV 文件**

創建 `test-guests.csv`：
```csv
name,email,company,invite_type
測試嘉賓A,testa@example.com,測試公司X,named
測試嘉賓B,testb@example.com,測試公司Y,company
測試嘉賓C,testc@example.com,,named
測試嘉賓D,testd@example.com,測試公司Z,company
測試嘉賓E,teste@example.com,,named
```

3. **測試文件上傳**
   - ✅ 點擊「選擇 CSV 文件」，選擇上面創建的文件
   - ✅ CSV 內容顯示在文本框
   - ✅ 顯示「6 行」（包含標題行）

4. **執行導入**
   - ✅ 點擊「開始導入」
   - ✅ 按鈕顯示「導入中...」
   - ✅ 導入完成後顯示結果：
     - 成功導入：5
     - 失敗：0

5. **驗證導入結果**
   - ✅ 點擊「查看嘉賓列表」
   - ✅ 新增的 5 位嘉賓顯示在列表中

#### 2.3 嘉賓列表與匯出

1. **訪問嘉賓列表**
   ```
   http://localhost:3000/admin/guests
   ```

2. **驗證表格**
   - ✅ 顯示所有嘉賓（測試資料 + 新導入）
   - ✅ 欄位完整：姓名、公司、郵箱、狀態、晚宴、雞尾酒、工作坊、簽到
   - ✅ 狀態 Badge 顏色正確
   - ✅ 工作坊格式正確（例：皮革 17:00）

3. **測試重新整理**
   - ✅ 點擊「重新整理」按鈕
   - ✅ 載入動畫顯示
   - ✅ 資料更新

4. **測試 CSV 匯出**
   - ✅ 點擊「匯出 CSV」
   - ✅ 按鈕顯示「匯出中...」
   - ✅ 文件自動下載（guests-export-YYYY-MM-DD.csv）
   - ✅ 用 Excel 或文字編輯器打開，確認資料完整

---

### 測試 3：RSVP 表單系統

**目標**: 測試兩種邀請類型的 RSVP 流程

#### 3.1 情況一：具名嘉賓

1. **訪問 RSVP 表單**
   ```
   http://localhost:3000/rsvp?invite=test-token-001
   ```

2. **驗證**
   - ✅ 標題顯示：「親愛的 [姓名]，誠摯邀請您出席」
   - ✅ 姓名欄位已預填且無法編輯
   - ✅ 沒有公司欄位

3. **填寫表單**
   - 晚宴：選擇「是，我會出席」
   - 雞尾酒會：選擇「是，我會出席」
   - 勾選「參加工作坊」
     - 類型：選擇「皮革工作坊」
     - 時段：選擇「17:00」

4. **提交表單**
   - ✅ 點擊「確認提交」
   - ✅ 按鈕顯示「提交中...」
   - ✅ 成功跳轉到確認頁面

#### 3.2 情況二：公司邀請

1. **訪問 RSVP 表單**
   ```
   http://localhost:3000/rsvp?invite=test-token-002
   ```

2. **驗證**
   - ✅ 標題顯示：「請填寫實際出席者資料」
   - ✅ 姓名欄位為空且可編輯
   - ✅ 有公司欄位（選填）

3. **填寫表單**
   - 姓名：輸入「王小明」
   - 公司：輸入「ABC 科技公司」
   - 晚宴：選擇「是，我會出席」
   - 雞尾酒會：選擇「否，我無法出席」
   - 勾選「參加工作坊」
     - 類型：選擇「香水工作坊」
     - 時段：選擇「16:30」

4. **提交表單**
   - ✅ 成功跳轉到確認頁面

#### 3.3 確認頁面

1. **驗證確認頁面**
   - ✅ 綠色勾選圖標顯示
   - ✅ 標題：「RSVP 確認成功！」
   - ✅ 顯示提交資料摘要：
     - 姓名正確
     - 晚宴選擇正確
     - 雞尾酒會選擇正確
     - 工作坊類型和時段正確（如有選擇）

2. **驗證 QR Code 區域**
   - ✅ 顯示「QR Code 將透過郵件發送」提示
   - ✅ 重要提示框顯示正確

3. **測試按鈕**
   - ✅ 「返回首頁」按鈕正常工作
   - ✅ 「列印確認頁」觸發列印對話框

---

### 測試 4：郵件系統與 QR Code

**目標**: 測試郵件發送和 QR Code 生成

#### 4.1 測試郵件 API

```bash
# 替換成你註冊 Resend 的郵箱
curl -X POST http://localhost:8787/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "type": "confirmation"}'
```

**預期結果**：
```json
{
  "success": true,
  "messageId": "..."
}
```

#### 4.2 檢查郵件內容

1. **打開郵箱**
   - ✅ 收到郵件（主旨：【確認】活動邀請 - 您的 QR Code 入場券）

2. **驗證郵件內容**
   - ✅ 綠色漸層標題
   - ✅ 綠色勾選圖標
   - ✅ 嘉賓姓名正確
   - ✅ 確認資料摘要正確
   - ✅ QR Code 清晰可見（300x300px）
   - ✅ 重要提示列表完整
   - ✅ 活動詳情正確

3. **測試不同郵件客戶端**（可選）
   - Gmail
   - Outlook
   - Apple Mail
   - 手機郵件 App

#### 4.3 完整 RSVP 流程測試

1. **從導入的測試嘉賓中選擇一個**
   - 在 Admin 嘉賓列表找到 token

2. **訪問 RSVP 頁面**
   ```
   http://localhost:3000/rsvp?invite=[token]
   ```

3. **填寫並提交表單**

4. **檢查結果**
   - ✅ 跳轉到確認頁面
   - ✅ 收到確認郵件（含 QR Code）
   - ✅ Admin 面板統計更新
   - ✅ 嘉賓列表狀態變為「已確認」

---

### 測試 5：API 端點

**目標**: 驗證所有 API 正常工作

#### 5.1 健康檢查

```bash
curl http://localhost:8787/
```

**預期**：
```json
{
  "message": "RSVP API is running",
  "version": "1.0.0"
}
```

#### 5.2 統計 API

```bash
curl http://localhost:8787/api/admin/stats
```

**預期**：返回完整統計資料

#### 5.3 嘉賓列表 API

```bash
curl http://localhost:8787/api/admin/guests
```

**預期**：返回所有嘉賓陣列

#### 5.4 CSV 導入 API

```bash
curl -X POST http://localhost:8787/api/admin/import \
  -H "Content-Type: application/json" \
  -d '{
    "csvData": "name,email,company,invite_type\nAPI測試,api@test.com,API公司,named"
  }'
```

**預期**：
```json
{
  "success": true,
  "imported": 1,
  "failed": 0
}
```

#### 5.5 CSV 匯出 API

```bash
curl http://localhost:8787/api/admin/export -o export-test.csv
```

**預期**：下載 CSV 文件

---

## 📊 測試檢查清單

### 基本功能
- [ ] 首頁正確顯示
- [ ] 所有導航連結正常
- [ ] RSVP 表單（情況一）正常工作
- [ ] RSVP 表單（情況二）正常工作
- [ ] 確認頁面正確顯示
- [ ] Admin 主頁統計正確
- [ ] 嘉賓列表完整顯示
- [ ] CSV 導入成功
- [ ] CSV 匯出成功

### 郵件功能
- [ ] 測試郵件成功發送
- [ ] RSVP 後自動發送確認郵件
- [ ] QR Code 在郵件中清晰顯示
- [ ] 郵件格式在各客戶端正常

### 資料完整性
- [ ] RSVP 資料正確儲存到資料庫
- [ ] 統計資料即時更新
- [ ] 匯出的 CSV 資料完整
- [ ] QR Code 包含正確的嘉賓資訊

### UI/UX
- [ ] 響應式設計在各裝置正常
- [ ] 載入狀態即時反饋
- [ ] 錯誤訊息清晰顯示
- [ ] 按鈕 hover 效果正常
- [ ] 表單驗證正確工作

### API
- [ ] 所有 API 端點正常回應
- [ ] 錯誤處理正確
- [ ] CORS 設置正確

---

## 🎯 效能測試

### 1. 大量資料測試

**測試 CSV 導入 100 筆資料**：

創建包含 100 筆測試資料的 CSV 文件，測試導入效能。

```csv
name,email,company,invite_type
測試嘉賓001,test001@example.com,公司A,named
測試嘉賓002,test002@example.com,公司B,company
...（繼續到 100）
```

**驗證**：
- ✅ 導入成功完成
- ✅ Admin 主頁統計正確
- ✅ 嘉賓列表載入流暢

### 2. 並發測試（可選）

使用多個瀏覽器分頁同時提交 RSVP，測試系統穩定性。

---

## 🐛 常見問題

### 問題 1：收不到郵件

**原因**：使用 `onboarding@resend.dev` 只能發送到註冊 Resend 的郵箱

**解決方案**：
- 使用註冊 Resend 的郵箱測試
- 或驗證自己的域名

### 問題 2：資料庫錯誤

**原因**：本地 D1 資料庫未初始化

**解決方案**：
```bash
npx wrangler d1 execute rsvp-db --local --file=workers/migrations/0001_initial_schema.sql
npx wrangler d1 execute rsvp-db --local --file=workers/migrations/0002_seed_data.sql
```

### 問題 3：API 無法連接

**原因**：Worker 服務未啟動或 Next.js 代理配置錯誤

**解決方案**：
- 確認 Worker 在 http://localhost:8787 運行
- 檢查 `next.config.ts` 的 rewrites 配置

---

## 📈 下一步

Phase 1-4 完成後，接下來將實現：

### Phase 5 - Check-in System（簽到系統）
- QR Code 掃描功能
- 即時嘉賓資訊顯示
- 重複掃描警告
- 工作坊券提示

### Phase 6 - QA & Polish（測試與優化）
- 完整的端到端測試
- 離線模式支援
- 效能優化
- 安全性加強

---

## 🎉 完成狀態

**已完成階段**: 4/6 (67%)
**功能完成度**: 核心功能 100% 完成

- ✅ Phase 1: 基礎設置
- ✅ Phase 2: RSVP 表單
- ✅ Phase 3: 郵件系統
- ✅ Phase 4: Admin 面板
- ⏳ Phase 5: 簽到系統
- ⏳ Phase 6: QA & Polish

---

**測試日期**: 2025-10-09  
**測試範圍**: Phase 1-4 完整功能  
**狀態**: ✅ 準備進行完整測試


