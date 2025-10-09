# 項目狀態 - 2025-10-08

## ✅ 已完成設置

### 前端 (Next.js 15)
- ✅ Next.js 15 + App Router
- ✅ TypeScript 5 配置
- ✅ Tailwind CSS 3.4 + PostCSS
- ✅ shadcn UI 組件系統
  - Button 組件
  - Card 組件
  - 工具函數 (cn)
- ✅ 基本頁面結構
  - `/` - 首頁
  - `/rsvp` - RSVP 表單頁
  - `/rsvp/confirmed` - 確認頁面
  - `/admin` - 管理面板
  - `/admin/import` - CSV 導入
  - `/admin/guests` - 嘉賓列表
  - `/checkin` - 簽到系統

### 後端 (Cloudflare Workers)
- ✅ Wrangler CLI 已安裝
- ✅ Hono 框架設置
- ✅ TypeScript 類型定義
- ✅ CORS 中間件配置
- ✅ API Endpoints
  - `GET /api/rsvp/:token` - 獲取嘉賓資料
  - `POST /api/rsvp/:token` - 提交 RSVP
  - `GET /api/admin/guests` - 獲取所有嘉賓
  - `POST /api/scan` - QR Code 簽到

### 資料庫 (Cloudflare D1)
- ✅ D1 資料庫配置
- ✅ Schema 設計完成
  - `guests` 表（嘉賓資料）
  - `scan_logs` 表（簽到記錄）
- ✅ Migration 文件
  - `0001_initial_schema.sql` - 資料庫結構
  - `0002_seed_data.sql` - 測試資料
- ✅ 索引優化

### 開發工具
- ✅ ESLint 配置
- ✅ Git 配置 (.gitignore)
- ✅ npm scripts 設置
- ✅ 環境變數範例文件

## 📦 已安裝的套件

### 生產依賴
```json
{
  "@hono/node-server": "^1.19.5",
  "@radix-ui/react-slot": "^1.2.3",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "hono": "^4.9.10",
  "lucide-react": "^0.545.0",
  "next": "^15.1.6",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "tailwind-merge": "^3.3.1",
  "tailwindcss-animate": "^1.0.7"
}
```

### 開發依賴
```json
{
  "wrangler": "^4.42.1",
  "typescript": "^5",
  "tailwindcss": "^3.4.17",
  "eslint": "^9",
  "autoprefixer": "^10.4.20"
}
```

## 📂 項目結構

```
rsvp/
├── app/                        # Next.js App Router
│   ├── admin/                  # 管理頁面
│   │   ├── guests/            # 嘉賓列表
│   │   ├── import/            # CSV 導入
│   │   └── page.tsx           # 管理主頁
│   ├── checkin/               # 簽到頁面
│   ├── rsvp/                  # RSVP 頁面
│   │   ├── confirmed/         # 確認頁面
│   │   └── page.tsx           # RSVP 表單
│   ├── globals.css            # 全局樣式
│   ├── layout.tsx             # 根佈局
│   └── page.tsx               # 首頁
├── components/                 # React 組件
│   └── ui/                    # shadcn UI 組件
│       ├── button.tsx
│       └── card.tsx
├── lib/                        # 工具函數
│   └── utils.ts
├── workers/                    # Cloudflare Workers
│   ├── migrations/            # D1 資料庫遷移
│   │   ├── 0001_initial_schema.sql
│   │   └── 0002_seed_data.sql
│   ├── src/                   # Worker 源碼
│   │   ├── index.ts           # 主 API
│   │   └── types.ts           # 類型定義
│   └── README.md              # API 文檔
├── .dev.vars.example          # 環境變數範例
├── .gitignore
├── components.json            # shadcn UI 配置
├── next.config.ts             # Next.js 配置
├── package.json
├── plan.md                    # 完整項目計劃
├── README.md                  # 項目說明
├── SETUP.md                   # 設置指南
├── tailwind.config.ts         # Tailwind 配置
├── tsconfig.json              # TypeScript 配置
└── wrangler.toml              # Cloudflare Workers 配置
```

## 🚀 可用指令

```bash
# Next.js 前端
npm run dev              # 啟動開發伺服器 (http://localhost:3000)
npm run build            # 構建生產版本
npm run start            # 運行生產伺服器
npm run lint             # 執行 ESLint

# Cloudflare Workers API
npm run worker:dev       # 啟動 Worker 開發伺服器 (http://localhost:8787)
npm run worker:deploy    # 部署到 Cloudflare

# D1 資料庫
npm run db:create        # 創建 D1 資料庫（一次性）
npm run db:migrate       # 執行本地 migration
npm run db:migrate:prod  # 執行生產環境 migration
```

## 🔜 下一步開發任務

根據 `plan.md`，接下來需要完成：

### Phase 2 - Frontend RSVP Form
- [ ] 實現動態表單（情況一/情況二）
- [ ] 工作坊時段選擇器
- [ ] 表單驗證
- [ ] 與 API 整合

### Phase 3 - Email System
- [ ] 設置 Resend API
- [ ] 創建 React Email 模板
  - 邀請郵件（情況一）
  - 邀請郵件（情況二）
  - 確認郵件（含 QR Code）
- [ ] 實現郵件發送 Worker endpoint

### Phase 4 - Admin Panel
- [ ] CSV 導入功能
- [ ] 嘉賓列表顯示
- [ ] 批量發送邀請
- [ ] 統計資料展示
- [ ] CSV 匯出功能
- [ ] 身份驗證

### Phase 5 - Check-in Page
- [ ] QR Code 掃描器整合（html5-qrcode）
- [ ] 即時嘉賓資訊顯示
- [ ] 重複掃描警告
- [ ] 工作坊券提示

### Phase 6 - Additional Features
- [ ] QR Code 生成（qrcode npm）
- [ ] PDF 生成（pdf-lib）
- [ ] 郵件重發功能
- [ ] 資料匯出

## 🔐 需要設置的服務

1. **Cloudflare D1**
   - 狀態: ⚠️ 需要創建資料庫
   - 執行: `npm run db:create`
   - 然後更新 `wrangler.toml` 的 `database_id`

2. **Resend**（郵件服務）
   - 狀態: ❌ 未設置
   - 需要: API Key
   - 註冊: https://resend.com

3. **Cloudflare Workers**（已設置）
   - 狀態: ✅ 已配置，需要登入
   - 執行: `npx wrangler login`

## 📚 文檔參考

- [README.md](README.md) - 項目概覽和快速開始
- [SETUP.md](SETUP.md) - 詳細設置指南
- [plan.md](plan.md) - 完整功能規劃
- [workers/README.md](workers/README.md) - API 文檔

## 🎯 項目目標

根據 plan.md，本系統需要實現：

1. **嘉賓流程**: 邀請 → RSVP → 確認郵件（含 QR Code）
2. **管理流程**: 導入名單 → 發送邀請 → 監控狀態 → 匯出資料
3. **簽到流程**: 掃描 QR Code → 顯示資訊 → 確認簽到 → 工作坊券

### 活動詳情
- 晚宴 + 雞尾酒會（可選）
- 工作坊（皮革/香水，4 個時段：16:30/17:00/17:30/18:00）
- 兩種邀請類型：
  - 情況一：具名嘉賓
  - 情況二：公司邀請（需填寫實際出席者）

---

**最後更新**: 2025-10-08  
**項目負責人**: Ross Chang  
**技術棧**: Next.js 15, Cloudflare Workers, D1, Hono, Tailwind, shadcn UI

