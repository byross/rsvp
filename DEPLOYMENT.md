# 部署指南

## 環境配置

本項目有兩個環境，每個環境都有獨立的 API 配置：

### 1. 本地開發環境
- **前端**: `http://localhost:3000`
- **後端 API**: `http://localhost:8787`
- **環境變量**: `.env.local`

### 2. 生產環境
- **前端**: `https://rsvp.momini.app`
- **後端 API**: `https://rsvp-api.byross-tech.workers.dev`
- **環境變量**: `.env.production`

## 環境變量設置

### `.env.local` (本地開發)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### `.env.production` (生產環境)
```bash
NEXT_PUBLIC_API_URL=https://rsvp-api.byross-tech.workers.dev
```

## 部署命令

### 本地開發
```bash
# 啟動前端開發服務器
npm run dev

# 啟動後端開發服務器
npm run worker:dev
```

### 生產環境部署

#### 方式一：一鍵部署（推薦）
```bash
# 同時部署前端和後端
npm run deploy:all
```

#### 方式二：分別部署
```bash
# 只部署後端
npm run deploy:backend

# 只部署前端
npm run deploy:frontend
```

### 手動構建和驗證

#### 構建生產版本
```bash
# 構建並驗證生產環境版本
npm run build:prod
```

#### 構建本地測試版本
```bash
# 構建並驗證本地環境版本
npm run build:local

# 使用靜態服務器預覽
npx serve out
```

## 部署檢查清單

在部署前，請確認：

- [ ] `.env.local` 和 `.env.production` 文件存在且配置正確
- [ ] 運行 `npm run build:prod` 確認構建成功
- [ ] 檢查構建驗證輸出，確認使用正確的 API URL
- [ ] 後端 API 已部署並可訪問
- [ ] 前端構建文件中包含正確的 API URL（不含 localhost）

## 環境變量處理機制

本項目使用以下機制確保環境變量正確：

1. **`next.config.ts`**: 提供 fallback 配置
   ```typescript
   env: {
     NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 
       (process.env.NODE_ENV === 'production' 
         ? 'https://rsvp-api.byross-tech.workers.dev' 
         : 'http://localhost:8787'),
   }
   ```

2. **`lib/config.ts`**: 在運行時讀取並驗證
   - 如果未設置 `NEXT_PUBLIC_API_URL`，會拋出錯誤
   - 記錄使用的 API URL 到 console

3. **構建腳本**: 自動驗證構建結果
   - `scripts/build-production.sh`: 檢查生產 URL
   - `scripts/build-local.sh`: 檢查本地 URL

## 常見問題

### Q: 為什麼線上版本還在使用 localhost API？
A: 可能的原因：
1. 使用了錯誤的構建命令（應該用 `npm run build:prod`）
2. 環境變量文件不存在或配置錯誤
3. 使用了舊的構建文件

解決方法：
```bash
# 清理並重新構建
rm -rf .next out
npm run build:prod
```

### Q: 如何驗證當前使用的 API URL？
A: 打開瀏覽器 Console，應該會看到：
```
🌐 Using API URL: https://rsvp-api.byross-tech.workers.dev
```

### Q: 本地開發時如何測試生產配置？
A: 
```bash
# 構建本地測試版本（使用生產 API）
NODE_ENV=production npm run build:pages
npx serve out
```

## 部署流程

### 完整部署步驟

1. **確認環境變量**
   ```bash
   cat .env.local
   cat .env.production
   ```

2. **構建並驗證**
   ```bash
   npm run build:prod
   ```

3. **部署後端**
   ```bash
   npm run deploy:backend
   ```

4. **部署前端**
   ```bash
   npm run deploy:frontend
   ```

5. **驗證部署**
   - 訪問 `https://rsvp.momini.app`
   - 打開瀏覽器 Console 檢查 API URL
   - 測試登入功能

## 技術細節

### 為什麼需要環境變量？

Next.js 的靜態導出 (`output: "export"`) 在**構建時**就確定了所有內容，包括 API URL。這意味著：

1. **構建時確定**：API URL 在 `npm run build` 時就被嵌入到 JavaScript 文件中
2. **運行時無法改變**：部署後無法通過環境變量改變 API URL
3. **需要分別構建**：本地和生產環境需要使用不同的環境變量構建

### 環境變量優先級

1. 腳本中設置的 `export` 變量（最高優先級）
2. `.env.production` 或 `.env.local` 文件
3. `next.config.ts` 中的 fallback 配置（最低優先級）

## 更新記錄

- **2025-10-21**: 添加構建驗證腳本，確保 API URL 正確
- **2025-10-21**: 更新 `next.config.ts`，添加明確的 fallback 配置
- **2025-10-21**: 簡化 `lib/config.ts`，移除不可靠的運行時判斷

