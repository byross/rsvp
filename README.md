# RSVP 電子邀請及 QR Code 簽到系統

一個功能完整的活動 RSVP 及簽到管理系統，由 byRoss Design & Tech 開發。

## 技術棧

- **前端框架**: Next.js 15 (App Router)
- **樣式**: Tailwind CSS 3.4
- **UI 組件**: shadcn UI
- **語言**: TypeScript 5
- **後端**: Cloudflare Workers (Hono) - 待實現
- **資料庫**: Cloudflare D1 - 待實現
- **電郵**: Resend - 待實現

## 項目結構

```
rsvp/
├── app/                    # Next.js App Router 頁面
│   ├── rsvp/              # RSVP 表單頁面
│   │   └── confirmed/     # 確認頁面
│   ├── admin/             # 管理面板
│   │   ├── import/        # CSV 導入
│   │   └── guests/        # 嘉賓列表
│   ├── checkin/           # 簽到系統
│   ├── layout.tsx         # 根佈局
│   ├── page.tsx           # 首頁
│   └── globals.css        # 全局樣式
├── components/            # React 組件
│   └── ui/               # shadcn UI 組件
│       ├── button.tsx
│       └── card.tsx
├── lib/                   # 工具函數
│   └── utils.ts          # 通用工具
└── plan.md               # 項目計劃文檔
```

## 開始使用

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

### 構建生產版本

```bash
npm run build
npm start
```

## 主要功能

### 嘉賓流程
1. 收到邀請郵件（包含獨特 token）
2. 填寫 RSVP 表單
   - 確認出席晚宴
   - 選擇雞尾酒會
   - 選擇工作坊（皮革/香水）及時段
3. 收到確認郵件及 QR Code

### 管理員流程
1. 導入嘉賓名單 (CSV)
2. 發送邀請郵件
3. 查看 RSVP 狀態
4. 匯出嘉賓資料

### 簽到流程
1. 掃描嘉賓 QR Code
2. 顯示嘉賓資訊及工作坊安排
3. 確認簽到

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設置 Cloudflare Workers (可選)

```bash
# 登入 Cloudflare
npx wrangler login

# 創建 D1 資料庫
npx wrangler d1 create rsvp-db

# 複製 database_id 到 wrangler.toml

# 執行 migration
npm run db:migrate
```

詳細說明請參考 [workers/README.md](workers/README.md)

### 3. 啟動開發伺服器

```bash
# 啟動 Next.js 前端
npm run dev

# 啟動 Cloudflare Workers API (另一個終端機)
npm run worker:dev
```

## ✅ 已完成功能

### Phase 1-4 完成 (80% 完成度)

✅ **Phase 1**: 基礎架構設置  
✅ **Phase 2**: RSVP 表單系統  
✅ **Phase 3**: 郵件與 QR Code 系統  
✅ **Phase 4**: Admin 管理面板  
✅ **生產環境**: 已部署到 Cloudflare

詳細進度請查看 [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md)  

## 可用指令

```bash
# Next.js 前端
npm run dev              # 啟動開發伺服器
npm run build            # 構建生產版本
npm run start            # 運行生產伺服器
npm run lint             # 執行 ESLint

# Cloudflare Workers API
npm run worker:dev       # 啟動 Worker 開發伺服器
npm run worker:deploy    # 部署到 Cloudflare

# D1 資料庫
npm run db:create        # 創建 D1 資料庫
npm run db:migrate       # 本地 migration
npm run db:migrate:prod  # 生產環境 migration
```

## ⏳ 進行中

### Phase 5 - 簽到系統
- [ ] QR Code 掃描器整合
- [ ] 即時嘉賓資訊顯示
- [ ] 簽到確認流程
- [ ] 重複掃描警告

詳細計劃請查看 [NEXT_STEPS.md](NEXT_STEPS.md)

## 📚 文檔導航

- [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) - 完整進度總覽 ⭐
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - 項目狀態
- [NEXT_STEPS.md](NEXT_STEPS.md) - 下一步計劃
- [plan.md](plan.md) - 完整技術規劃
- [DOCS_INDEX.md](DOCS_INDEX.md) - 所有文檔索引

## 🔗 生產環境

- **API**: https://rsvp-api.byross-tech.workers.dev
- **狀態**: 🟢 運行中
- **進度**: 80% 完成

---

## 開發者

**byRoss Design & Tech**  
技術主導: Ross Chang  
更新日期: 2025-10-13  
部署狀態: 🟢 生產環境運行中