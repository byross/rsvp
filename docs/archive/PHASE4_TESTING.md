# Phase 4 - Admin Panel 測試指南

## ✅ 已完成功能

### 1. Admin 主頁（/admin）
- ✅ 統計資料總覽
  - 總邀請數、已確認、待回覆、已婉拒
  - 晚宴和雞尾酒會出席人數
  - 工作坊統計（按類型和時段）
- ✅ 快速導航卡片
- ✅ 即時數據展示

### 2. 嘉賓列表（/admin/guests）
- ✅ 完整的嘉賓資料表格
- ✅ 顯示所有 RSVP 狀態
- ✅ CSV 匯出功能
- ✅ 即時重新整理

### 3. CSV 導入（/admin/import）
- ✅ 文件上傳或貼上功能
- ✅ CSV 格式驗證
- ✅ 批量導入處理
- ✅ 錯誤報告和統計

### 4. Worker API 端點
- ✅ `GET /api/admin/stats` - 統計資料
- ✅ `GET /api/admin/guests` - 嘉賓列表
- ✅ `POST /api/admin/import` - CSV 導入
- ✅ `GET /api/admin/export` - CSV 匯出

---

## 🧪 測試流程

### 前置準備

1. **創建 D1 資料庫**（如果還沒創建）

```bash
cd /Users/ross/Projects/rsvp/rsvp

# 創建本地 D1 資料庫
npx wrangler d1 execute rsvp-db --local --file=workers/migrations/0001_initial_schema.sql

# 導入測試資料
npx wrangler d1 execute rsvp-db --local --file=workers/migrations/0002_seed_data.sql
```

2. **確認服務器正在運行**
   - 前端：http://localhost:3000
   - Worker：http://localhost:8787

---

### 測試 1：Admin 主頁統計

1. **訪問 Admin 主頁**
   ```
   http://localhost:3000/admin
   ```

2. **驗證統計資料**
   - ✅ 總邀請數正確顯示
   - ✅ 各狀態數量正確（已確認、待回覆、已婉拒）
   - ✅ 確認率百分比計算正確
   - ✅ 晚宴和雞尾酒會人數統計
   - ✅ 工作坊統計（皮革/香水，各時段）

3. **測試快速導航**
   - ✅ 點擊「嘉賓列表」跳轉正確
   - ✅ 點擊「CSV 導入」跳轉正確
   - ✅ 點擊「返回首頁」跳轉正確

---

### 測試 2：嘉賓列表功能

1. **訪問嘉賓列表**
   ```
   http://localhost:3000/admin/guests
   ```

2. **驗證表格顯示**
   - ✅ 顯示所有嘉賓
   - ✅ 姓名、公司、郵箱正確
   - ✅ RSVP 狀態顯示正確（顏色標籤）
   - ✅ 晚宴/雞尾酒會顯示 ✓ 或 -
   - ✅ 工作坊類型和時段格式正確
   - ✅ 簽到狀態顯示正確

3. **測試重新整理**
   - ✅ 點擊「重新整理」按鈕
   - ✅ 按鈕顯示旋轉動畫
   - ✅ 資料成功重新載入

4. **測試 CSV 匯出**
   - ✅ 點擊「匯出 CSV」按鈕
   - ✅ 按鈕顯示「匯出中...」
   - ✅ CSV 文件自動下載
   - ✅ 文件名包含日期
   - ✅ 打開 CSV 文件，資料完整正確

---

### 測試 3：CSV 導入功能

1. **訪問 CSV 導入頁面**
   ```
   http://localhost:3000/admin/import
   ```

2. **準備測試資料**

創建 `test-import.csv`：
```csv
name,email,company,invite_type
測試用戶1,test1@example.com,測試公司A,named
測試用戶2,test2@example.com,測試公司B,company
測試用戶3,test3@example.com,,named
```

3. **測試文件上傳**
   - ✅ 點擊「選擇 CSV 文件」
   - ✅ 選擇準備好的測試文件
   - ✅ CSV 內容顯示在文本框
   - ✅ 顯示行數統計

4. **測試直接貼上**
   - ✅ 清除現有內容
   - ✅ 直接貼上 CSV 內容
   - ✅ 內容正確顯示

5. **測試導入功能**
   - ✅ 點擊「開始導入」
   - ✅ 按鈕顯示「導入中...」
   - ✅ 導入完成後顯示結果卡片：
     - 成功導入數量
     - 失敗數量
     - 錯誤訊息（如有）
   - ✅ 點擊「查看嘉賓列表」確認新嘉賓

6. **測試錯誤處理**

測試格式錯誤的 CSV：
```csv
name,email
測試用戶,test@example.com
```

預期結果：
- ✅ 顯示錯誤：「缺少必要欄位: invite_type」
- ✅ 失敗數量正確統計

---

### 測試 4：API 端點

#### 4.1 統計 API

```bash
curl http://localhost:8787/api/admin/stats
```

**預期回應**：
```json
{
  "total": 5,
  "confirmed": 2,
  "pending": 3,
  "declined": 0,
  "dinner": 2,
  "cocktail": 2,
  "workshopLeather": 1,
  "workshopPerfume": 1,
  "workshopByTime": {
    "leather-1700": 1,
    "perfume-1630": 1
  }
}
```

#### 4.2 嘉賓列表 API

```bash
curl http://localhost:8787/api/admin/guests
```

**預期回應**：
```json
[
  {
    "id": "...",
    "name": "張三",
    "company": null,
    "email": "test1@example.com",
    ...
  }
]
```

#### 4.3 CSV 導入 API

```bash
curl -X POST http://localhost:8787/api/admin/import \
  -H "Content-Type: application/json" \
  -d '{
    "csvData": "name,email,company,invite_type\n新用戶,new@example.com,新公司,named"
  }'
```

**預期回應**：
```json
{
  "success": true,
  "imported": 1,
  "failed": 0
}
```

#### 4.4 CSV 匯出 API

```bash
curl http://localhost:8787/api/admin/export -o export.csv
```

**預期結果**：
- ✅ 下載 `export.csv` 文件
- ✅ 包含所有嘉賓資料

---

## 🎯 完整流程測試

### 場景：從零開始管理活動

1. **導入嘉賓名單**
   - 訪問 `/admin/import`
   - 上傳包含 10 位嘉賓的 CSV
   - 確認導入成功

2. **查看統計資料**
   - 訪問 `/admin`
   - 確認顯示 10 位嘉賓
   - 全部狀態為「待回覆」

3. **模擬嘉賓 RSVP**
   - 訪問 `/rsvp?invite=token-xxx`（使用導入的 token）
   - 填寫並提交 RSVP

4. **確認更新**
   - 回到 `/admin`
   - 統計資料更新（已確認 +1）
   - 查看嘉賓列表，狀態變為「已確認」

5. **匯出資料**
   - 訪問 `/admin/guests`
   - 點擊「匯出 CSV」
   - 打開文件確認包含最新 RSVP 資料

---

## 📊 UI/UX 檢查清單

### 響應式設計
- [ ] 桌面瀏覽器（1920x1080）
- [ ] 平板（768x1024）
- [ ] 表格在小螢幕可橫向滾動

### 視覺效果
- [ ] 統計卡片動畫效果
- [ ] 表格 hover 效果
- [ ] 按鈕載入狀態
- [ ] 成功/失敗狀態顯示
- [ ] Badge 顏色正確（綠/橙/灰）

### 互動體驗
- [ ] 所有按鈕可點擊
- [ ] 載入狀態即時反饋
- [ ] 錯誤訊息清晰顯示
- [ ] 頁面跳轉流暢
- [ ] 文件上傳即時反應

---

## 🐛 已知限制

1. **無身份驗證**
   - 目前所有 API 端點未實現驗證
   - 生產環境需加入 Admin 密碼或 Cloudflare Access

2. **CSV 格式限制**
   - 僅支援簡單的逗號分隔
   - 不支援引號內的逗號（已有基本處理）

3. **資料庫限制**
   - 使用本地 D1，重啟 Worker 後資料保留
   - 生產環境需使用實際的 Cloudflare D1 資料庫

---

## ✅ 驗收標準

Phase 4 完成的標準：

- [x] Admin 主頁統計正確顯示
- [x] 嘉賓列表完整展示
- [x] CSV 導入功能正常
- [x] CSV 匯出功能正常
- [x] 所有 API 端點正常工作
- [x] UI 響應式設計
- [x] 錯誤處理完善

---

## 🚀 下一步（Phase 5）

完成 Phase 4 後，接下來將實現：

- 簽到系統（QR Code 掃描）
- 即時嘉賓資訊顯示
- 重複掃描警告
- 工作坊券提示

---

**測試日期**: 2025-10-09  
**測試範圍**: Phase 4 - Admin Panel  
**狀態**: ✅ 準備測試


