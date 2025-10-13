# 📚 文檔導航索引

**最後更新**: 2025-10-13  
歡迎來到 RSVP 系統文檔中心！這裡整理了所有項目文檔的快速導航。

---

## 🎯 快速開始

如果你是第一次接觸這個項目：
1. 閱讀 [README.md](#readme) 了解項目概況
2. 查看 [PROJECT_PROGRESS.md](#進度追蹤) 了解當前進度
3. 參考 [SETUP.md](#設置指南) 設置開發環境
4. 查看 [NEXT_STEPS.md](#下一步計劃) 了解待辦事項

---

## 📋 核心計劃文檔

### 主要規劃

#### [plan.md](plan.md)
**完整項目計劃與技術規格**
- 系統概覽和用戶流程
- 技術棧選擇
- 資料庫 Schema
- API 端點設計
- 開發階段規劃（Phase 1-6）
- 生產環境部署資訊

#### [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) ⭐ 推薦
**項目進度總覽**（最全面的狀態文檔）
- 整體完成度：80%
- 各階段完成度圖表
- 已完成功能清單
- 進行中和待開發功能
- 技術架構說明
- 生產環境資訊
- 里程碑時間線
- 已知問題與技術債務

#### [PROJECT_STATUS.md](PROJECT_STATUS.md)
**項目狀態摘要**
- 已完成設置概覽
- Phase 1-4 完成項目
- 下一步開發任務
- 生產環境配置
- 可用指令列表

#### [NEXT_STEPS.md](NEXT_STEPS.md) ⭐ 行動指南
**下一步詳細行動計劃**
- Phase 5 簽到系統開發計劃
- 詳細任務分解
- 時間估計
- 實作順序建議
- 完成標準

---

## 🚀 設置與部署

### 環境設置

#### [README.md](README.md) {#readme}
**項目說明與快速開始**
- 技術棧介紹
- 項目結構
- 安裝步驟
- 開發指令
- 主要功能概述

#### [docs/setup/SETUP.md](docs/setup/SETUP.md) {#設置指南}
**詳細設置指南**
- 開發環境配置
- 依賴安裝
- Cloudflare 服務設置
- 本地開發流程

### 配置指南

#### [docs/setup/SECRETS.md](docs/setup/SECRETS.md)
**環境變數與密鑰配置**
- 環境變數列表
- 本地開發配置（.dev.vars）
- 生產環境 Secrets 設置
- 安全最佳實踐

#### [docs/setup/R2_SETUP_GUIDE.md](docs/setup/R2_SETUP_GUIDE.md)
**Cloudflare R2 存儲設置**
- R2 Bucket 創建
- 公開訪問配置
- Worker 綁定設置
- QR Code 存儲實現

---

## 🧪 測試文檔

### 測試指南

#### [docs/testing/COMPLETE_TESTING_GUIDE.md](docs/testing/COMPLETE_TESTING_GUIDE.md) ⭐ 完整指南
**全面的測試指南**
- 環境準備
- 各功能模塊測試步驟
- API 測試方法
- 故障排除

#### [docs/testing/TESTING_SUMMARY.md](docs/testing/TESTING_SUMMARY.md)
**測試執行總結**
- 已完成測試項目
- 測試結果統計
- 發現的問題
- 待手動測試清單

#### [docs/testing/QUICK_TEST_GUIDE.md](docs/testing/QUICK_TEST_GUIDE.md)
**快速測試檢查清單**
- 核心功能快速驗證
- 常見場景測試

#### [docs/testing/TEST_RESULTS.md](docs/testing/TEST_RESULTS.md)
**測試結果記錄**
- 各階段測試結果
- 性能測試數據
- 問題追蹤

---

## 👥 客戶與業務

#### [docs/client/CLIENT_INFO.md](docs/client/CLIENT_INFO.md)
**客戶資訊**
- 客戶需求
- 聯絡資訊
- 特殊要求

---

## 📂 歸檔文檔

#### [docs/archive/](docs/archive/)
**已完成的設置和測試記錄**

包含文檔：
- `DEPLOYMENT_SUCCESS.md` - 部署成功記錄
- `AUTH_SETUP_COMPLETE.md` - 認證設置完成
- `RESEND_SETUP_STATUS.md` - 郵件服務設置
- `PHASE3_TESTING.md` - Phase 3 測試指南
- `PHASE4_TESTING.md` - Phase 4 測試指南

這些文檔已完成其主要用途，保留作為歷史參考。

---

## 🗂️ 按用途分類

### 📖 了解項目
- [README.md](README.md) - 項目介紹
- [plan.md](plan.md) - 完整計劃
- [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) - 進度總覽
- [docs/client/CLIENT_INFO.md](docs/client/CLIENT_INFO.md) - 客戶資訊

### 🛠️ 開發設置
- [docs/setup/SETUP.md](docs/setup/SETUP.md) - 環境設置
- [docs/setup/SECRETS.md](docs/setup/SECRETS.md) - 配置密鑰
- [docs/setup/R2_SETUP_GUIDE.md](docs/setup/R2_SETUP_GUIDE.md) - R2 設置

### 📊 追蹤進度
- [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) - 整體進度
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - 當前狀態
- [NEXT_STEPS.md](NEXT_STEPS.md) - 下一步計劃

### 🧪 測試驗證
- [docs/testing/COMPLETE_TESTING_GUIDE.md](docs/testing/COMPLETE_TESTING_GUIDE.md) - 完整測試
- [docs/testing/TESTING_SUMMARY.md](docs/testing/TESTING_SUMMARY.md) - 測試總結
- [docs/testing/QUICK_TEST_GUIDE.md](docs/testing/QUICK_TEST_GUIDE.md) - 快速測試

### 📚 參考資料
- [docs/archive/](docs/archive/) - 歷史記錄

---

## 🔍 按角色查找

### 新加入的開發者
1. [README.md](README.md) - 了解項目
2. [docs/setup/SETUP.md](docs/setup/SETUP.md) - 設置環境
3. [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) - 了解進度
4. [NEXT_STEPS.md](NEXT_STEPS.md) - 開始工作

### 項目經理/負責人
1. [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) - 整體進度
2. [plan.md](plan.md) - 完整規劃
3. [docs/testing/TESTING_SUMMARY.md](docs/testing/TESTING_SUMMARY.md) - 測試狀態
4. [docs/client/CLIENT_INFO.md](docs/client/CLIENT_INFO.md) - 客戶資訊

### QA 測試人員
1. [docs/testing/COMPLETE_TESTING_GUIDE.md](docs/testing/COMPLETE_TESTING_GUIDE.md) - 測試指南
2. [docs/testing/QUICK_TEST_GUIDE.md](docs/testing/QUICK_TEST_GUIDE.md) - 快速檢查
3. [docs/testing/TEST_RESULTS.md](docs/testing/TEST_RESULTS.md) - 記錄結果

### 運維/部署人員
1. [docs/setup/SETUP.md](docs/setup/SETUP.md) - 環境配置
2. [docs/setup/SECRETS.md](docs/setup/SECRETS.md) - 密鑰管理
3. [docs/setup/R2_SETUP_GUIDE.md](docs/setup/R2_SETUP_GUIDE.md) - 存儲設置
4. [docs/archive/DEPLOYMENT_SUCCESS.md](docs/archive/DEPLOYMENT_SUCCESS.md) - 部署參考

---

## 📝 文檔維護

### 更新頻率
- **每日更新**: NEXT_STEPS.md（開發期間）
- **每週更新**: PROJECT_PROGRESS.md, PROJECT_STATUS.md
- **里程碑更新**: plan.md
- **按需更新**: 測試和設置文檔

### 文檔責任
- **技術負責人**: Ross Chang
- **最後全面更新**: 2025-10-13

---

## 💡 使用建議

### 日常開發
每天開始工作前：
1. 查看 [NEXT_STEPS.md](NEXT_STEPS.md) 確認當日任務
2. 更新 [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) 記錄進度

### 遇到問題
1. 查看相關設置指南（[docs/setup/](docs/setup/)）
2. 參考測試文檔（[docs/testing/](docs/testing/)）
3. 檢查歸檔文檔是否有類似問題的解決方案

### 新功能開發
1. 查看 [plan.md](plan.md) 確認技術規格
2. 參考 [NEXT_STEPS.md](NEXT_STEPS.md) 了解實作細節
3. 開發後更新相關測試文檔

---

## 🔗 外部資源

### 技術文檔
- [Next.js 文檔](https://nextjs.org/docs)
- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文檔](https://developers.cloudflare.com/d1/)
- [Resend API 文檔](https://resend.com/docs)
- [shadcn/ui 文檔](https://ui.shadcn.com/)

### 工具文檔
- [Hono 框架](https://hono.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [html5-qrcode](https://github.com/mebjas/html5-qrcode)

---

## 📞 需要幫助？

找不到需要的文檔？
1. 使用文字搜索功能查找關鍵詞
2. 檢查 [docs/archive/](docs/archive/) 是否有相關歷史文檔
3. 聯絡項目負責人 Ross Chang

---

**文檔總數**: 15+ 主要文檔 + 5 歸檔文檔  
**總字數**: ~50,000+ 字  
**涵蓋範圍**: 計劃 | 開發 | 測試 | 部署 | 維護

**最後整理**: 2025-10-13  
**版本**: 1.0

