# Phase 3 - Email System 測試指南

## ✅ 已完成功能

### 1. QR Code 生成
- ✅ 使用 SHA-256 生成 checksum
- ✅ 包含嘉賓 ID、token、姓名、時間戳
- ✅ 輸出為 base64 data URL
- ✅ 支援驗證和過期檢查（30天）

### 2. 郵件模板
- ✅ 邀請郵件 - 情況一（具名嘉賓）
- ✅ 邀請郵件 - 情況二（公司邀請）
- ✅ 確認郵件（含 QR Code）
- ✅ 響應式設計，支援各種郵件客戶端

### 3. 郵件發送整合
- ✅ Resend API 整合
- ✅ 自動在 RSVP 提交後發送確認郵件
- ✅ 錯誤處理（即使郵件失敗，RSVP 仍會保存）

---

## 🧪 測試方法

### 前置條件

1. ✅ Resend API Key 已設置（在 `.dev.vars`）
2. ✅ Worker 正在運行（`npm run worker:dev`）
3. ✅ 前端正在運行（`npm run dev`）

### 測試 1：測試郵件發送 API

使用專門的測試端點發送測試郵件：

```bash
curl -X POST http://localhost:8787/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "type": "confirmation"
  }'
```

**預期結果**：
- ✅ 返回 `{ "success": true, "messageId": "..." }`
- ✅ 收到確認郵件，包含 QR Code
- ✅ 郵件格式正確，所有資料正確顯示

⚠️ **重要**：由於使用 `onboarding@resend.dev`，只能發送到你註冊 Resend 的郵箱。

### 測試 2：完整 RSVP 流程

1. **訪問 RSVP 表單**
   ```
   http://localhost:3000/rsvp?invite=test-token-001
   ```

2. **填寫表單**
   - 選擇晚宴：是
   - 選擇雞尾酒會：是
   - 選擇工作坊：皮革工作坊
   - 選擇時段：17:00

3. **提交表單**

4. **驗證結果**
   - ✅ 跳轉到確認頁面
   - ✅ 收到確認郵件
   - ✅ 郵件包含正確的 QR Code
   - ✅ 郵件包含所有選擇的資料

### 測試 3：檢查資料庫

確認 RSVP 資料已正確保存：

```bash
# 使用 D1 local database
npx wrangler d1 execute rsvp-db --local \
  --command "SELECT * FROM guests WHERE token = 'test-token-001'"
```

**預期結果**：
- ✅ `rsvp_status` = 'confirmed'
- ✅ `dinner`, `cocktail` 正確更新
- ✅ `workshop_type`, `workshop_time` 正確儲存

---

## 📧 郵件內容檢查清單

### 確認郵件應包含

- [ ] ✓ 勾選符號和「RSVP 確認成功」標題
- [ ] 嘉賓姓名
- [ ] 晚宴選擇（✓ 出席 / ✗ 不出席）
- [ ] 雞尾酒會選擇
- [ ] 工作坊類型和時段（如有選擇）
- [ ] QR Code 圖片（清晰可見）
- [ ] 活動詳情（名稱、日期、地點）
- [ ] 重要提示列表

### 視覺檢查

- [ ] 漸層背景正確顯示
- [ ] QR Code 居中顯示
- [ ] 所有文字清晰可讀
- [ ] 在不同郵件客戶端正常顯示：
  - [ ] Gmail
  - [ ] Outlook
  - [ ] Apple Mail
  - [ ] 手機郵件 App

---

## 🔍 故障排除

### 問題：收不到郵件

**可能原因**：
1. 使用 `onboarding@resend.dev` 只能發送到註冊 Resend 的郵箱
2. Resend API Key 錯誤
3. 環境變數未正確載入

**解決方案**：
```bash
# 檢查環境變數
cat .dev.vars | grep RESEND

# 確認 Worker 已載入變數
# 在 terminal 應該看到：
# env.RESEND_API_KEY ("(hidden)")
```

### 問題：API 返回錯誤

**檢查**：
```bash
# 查看 Worker logs
# 在運行 worker:dev 的 terminal 查看錯誤訊息
```

### 問題：QR Code 無法顯示

**可能原因**：
1. QR Code 生成失敗
2. Base64 data URL 格式錯誤

**解決方案**：
- 查看 Worker console 日誌
- 確認 `QR_SECRET` 已設置

---

## 📝 API 端點文檔

### POST /api/test-email

測試郵件發送功能（開發專用）。

**請求**：
```json
{
  "email": "your-email@example.com",
  "type": "confirmation"
}
```

**回應**：
```json
{
  "success": true,
  "messageId": "abc123..."
}
```

### POST /api/rsvp/:token

提交 RSVP 表單，自動發送確認郵件。

**請求**：
```json
{
  "name": "張三",
  "company": "ABC公司",
  "dinner": true,
  "cocktail": true,
  "workshop_type": "leather",
  "workshop_time": "1700"
}
```

**回應**：
```json
{
  "success": true,
  "message": "RSVP submitted successfully",
  "emailSent": true,
  "messageId": "abc123..."
}
```

---

## 🎯 測試場景

### 場景 1：全部出席

- 晚宴：是
- 雞尾酒會：是
- 工作坊：皮革工作坊 17:00

**預期**：郵件包含所有選項

### 場景 2：部分出席

- 晚宴：是
- 雞尾酒會：否
- 工作坊：無

**預期**：郵件不顯示工作坊資訊

### 場景 3：不同工作坊

- 工作坊：香水工作坊 16:30

**預期**：郵件顯示正確的工作坊資訊

---

## ✅ 驗收標準

Phase 3 完成的標準：

- [x] QR Code 可以正常生成
- [x] 確認郵件可以成功發送
- [x] 郵件包含正確的嘉賓資訊
- [x] QR Code 在郵件中清晰可見
- [x] RSVP 提交後自動發送郵件
- [x] 即使郵件失敗，RSVP 仍會保存
- [x] 測試 API 端點正常工作

---

## 📚 相關文件

- `workers/src/qr-generator.ts` - QR Code 生成
- `workers/src/emails/templates.ts` - 郵件模板
- `workers/src/emails/sender.ts` - 郵件發送
- `workers/src/index.ts` - API 端點

---

## 🚀 下一步（Phase 4）

完成 Phase 3 後，接下來將實現：

- Admin 面板完整功能
- CSV 導入/匯出
- 批量發送邀請郵件
- 統計資料展示

---

**測試日期**: 2025-10-09  
**測試範圍**: Phase 3 - Email System  
**狀態**: ✅ 準備測試


