# 🚀 快速測試指南

**測試日期**: 2025-10-09  
**郵箱**: ross@byross.net

---

## ✅ 系統狀態

### 正常運行的服務
- ✅ 前端服務: http://localhost:3000
- ✅ 後端 API: http://localhost:8787
- ✅ 資料庫: 已初始化（4 筆測試資料）

### ⚠️ 已知問題
- ⚠️ **郵件系統**: 在 Worker 環境中發送失敗（可能是 Resend 庫兼容性問題）
- 影響: RSVP 提交會因為郵件發送失敗而無法完成

---

## 🎯 立即可測試的項目

### 1. 首頁測試 🏠
**訪問**: http://localhost:3000

**測試內容**:
- [ ] 頁面載入正常
- [ ] Hero section 顯示「RSVP 電子邀請系統」
- [ ] 四個功能卡片正確顯示
- [ ] 快速導航連結可點擊

---

### 2. Admin 管理面板 📊
**訪問**: http://localhost:3000/admin

**測試內容**:
- [ ] 統計卡片顯示：
  - 總邀請數: **4**
  - 已確認: **1** (25.0%)
  - 待回覆: **3**
  - 已婉拒: **0**
- [ ] 活動統計：
  - 晚宴: 1 人
  - 雞尾酒會: 1 人
- [ ] 工作坊統計：
  - 皮革工作坊: 1 人（17:00 時段: 1）
  - 香水工作坊: 0 人
- [ ] 快速操作卡片可點擊

---

### 3. 嘉賓列表 📋
**訪問**: http://localhost:3000/admin/guests

**測試內容**:
- [ ] 顯示 4 位嘉賓：
  1. 張三 (named, pending, ABC Company)
  2. To be confirmed (company, pending, XYZ Corporation)
  3. 李四 (named, confirmed, DEF Ltd) - 已選擇皮革工作坊 17:00
  4. API測試嘉賓 (named, pending, API公司)
- [ ] 表格欄位完整顯示
- [ ] 「重新整理」按鈕正常工作
- [ ] **「匯出 CSV」按鈕測試**（應該成功下載文件）

---

### 4. CSV 導入測試 📥
**訪問**: http://localhost:3000/admin/import

**測試文件**: `test-guests.csv`（已創建）

**測試步驟**:
1. [ ] 點擊「選擇 CSV 文件」
2. [ ] 選擇 `test-guests.csv`
3. [ ] 確認顯示內容和行數（6 行含標題）
4. [ ] 點擊「開始導入」
5. [ ] 確認成功導入 5 筆資料
6. [ ] 回到嘉賓列表確認新增資料（總共應該有 9 筆）

---

### 5. RSVP 表單查看（不提交）📝

#### 5.1 具名嘉賓表單
**訪問**: http://localhost:3000/rsvp?invite=token_abc123

**測試內容**:
- [ ] 標題顯示：「親愛的 張三，誠摯邀請您出席」
- [ ] 姓名欄位已預填「張三」且不可編輯（灰色）
- [ ] 沒有公司欄位
- [ ] 晚宴單選框正常顯示
- [ ] 雞尾酒會單選框正常顯示
- [ ] 工作坊複選框正常工作
- [ ] 選擇工作坊後顯示類型和時段選項
- [ ] 表單 UI 美觀且響應式

⚠️ **暫時不要提交表單**（因為郵件系統問題）

#### 5.2 公司邀請表單
**訪問**: http://localhost:3000/rsvp?invite=token_xyz789

**測試內容**:
- [ ] 標題顯示：「請填寫實際出席者資料」
- [ ] 姓名欄位為空且可編輯
- [ ] 顯示公司欄位（選填）
- [ ] 所有表單欄位正常工作

⚠️ **暫時不要提交表單**（因為郵件系統問題）

---

## 🧪 API 測試（使用 curl）

### API 健康檢查
```bash
curl http://localhost:8787/
```
**預期**: 返回 `{"message":"RSVP API is running","version":"1.0.0"}`

### 查看統計
```bash
curl http://localhost:8787/api/admin/stats | python3 -m json.tool
```
**預期**: 返回完整統計資料

### 查看嘉賓列表
```bash
curl http://localhost:8787/api/admin/guests | python3 -m json.tool
```
**預期**: 返回 4 筆嘉賓資料

### 查詢特定嘉賓（張三）
```bash
curl http://localhost:8787/api/rsvp/token_abc123 | python3 -m json.tool
```
**預期**: 返回張三的完整資料

### CSV 匯出測試
```bash
curl http://localhost:8787/api/admin/export -o test-export.csv
cat test-export.csv
```
**預期**: 下載 CSV 文件並顯示 4 筆嘉賓資料

---

## 📊 測試檢查清單

### 基本功能（可立即測試）
- [ ] 首頁正確顯示
- [ ] Admin 面板統計正確
- [ ] 嘉賓列表完整顯示
- [ ] CSV 導入成功
- [ ] CSV 匯出成功
- [ ] RSVP 表單正確顯示（具名嘉賓）
- [ ] RSVP 表單正確顯示（公司邀請）
- [ ] 所有導航連結正常

### UI/UX
- [ ] 響應式設計正常
- [ ] 載入狀態顯示
- [ ] 按鈕 hover 效果
- [ ] 表單驗證提示
- [ ] 顏色主題一致

### API 功能
- [ ] 健康檢查 API
- [ ] 統計 API
- [ ] 嘉賓列表 API
- [ ] 嘉賓查詢 API
- [ ] CSV 導入 API
- [ ] CSV 匯出 API

---

## ⏳ 暫時無法測試的項目

### 需要修復郵件系統後才能測試
- ⏳ RSVP 表單提交
- ⏳ 確認頁面顯示
- ⏳ 郵件發送
- ⏳ QR Code 生成
- ⏳ 完整的 RSVP 流程

---

## 🔧 郵件系統問題分析

### 問題描述
測試郵件 API 返回錯誤：`{"error":"Failed to send test email"}`

### 可能原因
1. **Resend 庫兼容性**: Resend NPM 包可能無法在 Cloudflare Workers 環境中正常工作
2. **環境變數**: QR_SECRET 或其他環境變數可能未正確加載
3. **QRCode 庫**: qrcode 庫在 Worker 環境中的兼容性問題

### 建議解決方案

#### 方案 1: 短期修復（推薦）
修改 RSVP 提交邏輯，使郵件發送失敗時仍能完成 RSVP：

```typescript
// 在 workers/src/index.ts 的 RSVP 提交處理中修改
if (!emailResult.success) {
  console.error('Failed to send confirmation email:', emailResult.error);
  // 不要返回錯誤，繼續完成 RSVP
}

return c.json({ 
  success: true, 
  message: 'RSVP submitted successfully',
  emailSent: false,  // 告知前端郵件未發送
  emailError: emailResult.error
});
```

#### 方案 2: 使用 Fetch API
直接使用 Fetch API 調用 Resend REST API，避免使用 Resend SDK。

#### 方案 3: 郵件系統分離
將郵件發送移到 Next.js API Route，或使用 Cloudflare Queue Workers 異步處理。

---

## 📝 測試資料

### 現有測試 Token

| 姓名 | Token | 類型 | 用途 |
|------|-------|------|------|
| 張三 | `token_abc123` | named | 測試具名嘉賓 RSVP |
| To be confirmed | `token_xyz789` | company | 測試公司邀請 RSVP |
| 李四 | `token_def456` | named | 已確認嘉賓範例 |

### 測試郵箱
- ross@byross.net

---

## 🎯 建議測試順序

1. **✅ 先測試所有可用功能**（約 15 分鐘）
   - 首頁和導航
   - Admin 面板和統計
   - 嘉賓列表
   - CSV 導入/匯出
   - RSVP 表單顯示

2. **📊 記錄測試結果**
   - 哪些功能正常
   - 發現的 UI/UX 問題
   - 需要改進的地方

3. **🔧 決定是否修復郵件系統**
   - 如果前端功能都正常，再處理後端郵件問題
   - 或者先繼續開發 Phase 5（簽到系統）

---

## 💬 測試回饋

請在測試後回報：
1. ✅ 哪些功能正常運作
2. ❌ 發現的問題或 Bug
3. 💡 UI/UX 改進建議
4. 🎯 優先要修復的項目

---

**開始測試**: 打開瀏覽器訪問 http://localhost:3000 🚀

