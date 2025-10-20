# go-reg-lookup

安全部署架構：**GitHub Pages + Google Apps Script**  
資料只在部署產物中出現，不會存在 repo 裡。

## 🚀 部署流程

### 1️⃣ 準備 Google Apps Script (GAS)
1. 在 https://script.google.com 建立專案，貼入安全版遮蔽程式。
2. 設定：
   - `SHEET_ID` → 試算表網址中 /d/ 與 /edit 之間那段。
   - `SHEET_NAME` → 例如「表單回應 1」。
   - `API_KEY`（可選） → 若要金鑰保護。
3. 部署為「Web 應用程式」，存取權設「任何人」。

### 2️⃣ 設定 GitHub Secrets
| 名稱 | 值 |
|------|----|
| GAS_EXEC_URL | 你的 GAS `/exec` 網址 |
| GAS_KEY | 若啟用金鑰則填入；否則略過 |

### 3️⃣ 上傳專案
```bash
git init
git add .
git commit -m "init: go-reg-lookup project"
git branch -M main
git remote add origin https://github.com/<你的帳號>/go-reg-lookup.git
git push -u origin main
```

### 4️⃣ 啟用 GitHub Pages
- 打開 Settings → Pages，Source 選 **GitHub Actions**
- 等待 workflow `Build & Deploy Pages (with runtime data)` 執行完畢

### 5️⃣ 驗證
打開：https://<你的帳號>.github.io/go-reg-lookup/

repo 裡沒有清單檔；前端頁面會自動載入部署時生成的 data.json。
