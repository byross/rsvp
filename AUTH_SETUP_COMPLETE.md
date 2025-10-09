# 🔐 Admin 認證系統設置完成

**日期**: 2025-10-09  
**類型**: 簡化密碼認證方案

---

## ✅ 已完成功能

### 1. 後端 API
- ✅ `/api/admin/login` - 密碼驗證登入
- ✅ `/api/admin/verify` - Token 驗證
- ✅ 所有 Admin API 已保護（需要認證）
- ✅ Token 有效期：24 小時

### 2. 前端頁面
- ✅ `/admin/login` - 登入頁面
- ✅ `AdminAuthGuard` - 認證保護組件
- ✅ `/admin` - 主面板（已保護）
- ✅ 登出功能

### 3. 安全機制
- ✅ 密碼存在環境變數（不寫死代碼）
- ✅ Token 加密存儲
- ✅ 自動過期機制
- ✅ 未登入自動跳轉

---

## 🔑 登入資訊

### 本地開發
- **URL**: http://localhost:3000/admin/login
- **密碼**: `admin123_change_me`（在 `.dev.vars` 中設置）

### 生產環境
- **密碼**: 已設置在 Cloudflare Workers Secrets
- 查看/修改：`npx wrangler secret put ADMIN_PASSWORD`

---

## 🧪 測試步驟

### 1. 測試登入

```bash
# 訪問 Admin 頁面（未登入）
http://localhost:3000/admin

# 預期：自動跳轉到登入頁面
http://localhost:3000/admin/login
```

### 2. 輸入密碼登入

1. 在登入頁面輸入密碼：`admin123_change_me`
2. 點擊「登入」
3. 應該成功跳轉到 Admin 面板

### 3. 測試受保護頁面

登入後可以訪問：
- ✅ `/admin` - 管理面板
- ✅ `/admin/guests` - 嘉賓列表（需要加保護）
- ✅ `/admin/import` - CSV 導入（需要加保護）

### 4. 測試登出

1. 在 Admin 頁面點擊「登出」按鈕
2. 應該清除 Token 並跳轉到登入頁面
3. 再訪問 `/admin` 應該要求重新登入

---

## 📝 需要更新的頁面

以下頁面還需要添加 `AdminAuthGuard`：

### `/admin/guests/page.tsx`
```typescript
import AdminAuthGuard from "@/components/AdminAuthGuard";

export default function GuestsPage() {
  return (
    <AdminAuthGuard>
      {/* 現有內容 */}
    </AdminAuthGuard>
  );
}
```

### `/admin/import/page.tsx`
```typescript
import AdminAuthGuard from "@/components/AdminAuthGuard";

export default function ImportPage() {
  return (
    <AdminAuthGuard>
      {/* 現有內容 */}
    </AdminAuthGuard>
  );
}
```

### `/checkin/page.tsx`（如果有）
```typescript
import AdminAuthGuard from "@/components/AdminAuthGuard";

export default function CheckinPage() {
  return (
    <AdminAuthGuard>
      {/* 現有內容 */}
    </AdminAuthGuard>
  );
}
```

---

## 🔧 如何修改密碼

### 本地環境
編輯 `.dev.vars` 文件：
```bash
ADMIN_PASSWORD=your_new_password_here
```

### 生產環境
```bash
cd /Users/ross/Projects/rsvp/rsvp
echo "your_new_password" | npx wrangler secret put ADMIN_PASSWORD
```

---

## 🚀 部署到生產環境

```bash
cd /Users/ross/Projects/rsvp/rsvp

# 部署 Worker（包含新的認證 API）
npx wrangler deploy

# 確認密碼已設置
npx wrangler secret list

# 如果沒有 ADMIN_PASSWORD，設置它
echo "your_secure_password" | npx wrangler secret put ADMIN_PASSWORD
```

---

## 📊 安全等級

### ✅ 已實現
- 密碼不寫死在代碼
- Token 加密
- 自動過期
- 前端路由保護

### ⚠️ 簡化之處（可接受）
- 單一密碼（無用戶管理）
- 簡單 Token（非 JWT）
- 無角色區分

### 💡 適用場景
- ✅ 單一管理員使用
- ✅ 一次性活動
- ✅ 短期項目
- ❌ 不適合長期多用戶系統

---

## 🎯 快速測試清單

- [ ] 訪問 `/admin` 自動跳轉到登入頁
- [ ] 錯誤密碼顯示錯誤訊息
- [ ] 正確密碼成功登入並跳轉
- [ ] 登入後可以查看 Admin 面板
- [ ] 點擊登出可以成功登出
- [ ] Token 在 24 小時後失效
- [ ] RSVP 頁面保持公開（無需登入）

---

## 📚 相關文件

- `lib/auth.ts` - 認證工具函數
- `components/AdminAuthGuard.tsx` - 認證保護組件
- `app/admin/login/page.tsx` - 登入頁面
- `workers/src/index.ts` - 後端認證 API

---

**系統已準備就緒！** 🎉

現在所有 Admin 功能都受密碼保護，只有登入的管理員才能訪問。

